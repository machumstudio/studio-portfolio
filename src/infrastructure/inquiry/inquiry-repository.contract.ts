import { describe, expect, it } from "vitest";
import type { AdminInquiryRepository } from "@/application/inquiry/admin-inquiry-repository";
import {
  restoreInquiry,
  type Inquiry,
  type InquiryId,
  type InquiryInput,
} from "@/domain/inquiry/inquiry";
import type { InquiryStatus } from "@/domain/inquiry/status";

// InquiryRepository(+ 관리자 목록/지우기 AdminInquiryRepository) 계약 테스트. 구현마다 *.test.ts 에서 불러 같은 시나리오를 돌린다:
//   describeInquiryRepositoryContract("인메모리", (inquiries) => createInMemoryInquiryRepository(inquiries));
// setup 은 테스트마다 inquiries 만 들어 있는 새 저장소를 돌려준다 (Supabase 는 테이블을 비우고 넣는다)
export function describeInquiryRepositoryContract(
  name: string,
  setup: (
    inquiries: readonly Inquiry[],
  ) => AdminInquiryRepository | Promise<AdminInquiryRepository>,
) {
  describe(`InquiryRepository 계약: ${name}`, () => {
    it("findAll 은 전체를 돌려준다 (순서 무관)", async () => {
      const repo = await setup(inquiries);
      expect(byId(await repo.findAll())).toEqual(byId(inquiries));
    });

    it("비어 있으면 findAll 은 빈 목록", async () => {
      const repo = await setup([]);
      expect(await repo.findAll()).toEqual([]);
    });

    it.each([
      ["연락처 있음, New", () => fresh],
      ["연락처 없음, Read(시각 포함)", () => read],
      ["여러 줄 메시지, Done(시각 포함)", () => done],
    ])("findById 는 모든 필드를 그대로 돌려준다: %s", async (_, inquiry) => {
      const repo = await setup(inquiries);
      expect(await repo.findById(inquiry().id)).toEqual(inquiry());
    });

    it.each([
      ["형식이 맞는 없는 id", "00000000-0000-4000-8000-0000000000ff"],
      ["형식이 다른 id (주소에 직접 친 값)", "nope"],
    ])("%s 는 null", async (_, id) => {
      const repo = await setup(inquiries);
      expect(await repo.findById(id as InquiryId)).toBeNull();
    });

    it("save 한 새 문의는 findById, findAll 로 읽힌다", async () => {
      const repo = await setup([]);
      await repo.save(fresh);
      expect(await repo.findById(fresh.id)).toEqual(fresh);
      expect(await repo.findAll()).toEqual([fresh]);
    });

    it("같은 id 로 save 하면 덮어쓰고 늘어나지 않는다 (상태 변경)", async () => {
      const repo = await setup(inquiries);
      const changed: Inquiry = {
        ...fresh,
        status: { type: "Read", changedAt: at("2026-10-24T11:22:33.456Z") },
      };
      await repo.save(changed);
      expect(await repo.findById(fresh.id)).toEqual(changed);
      expect(await repo.findAll()).toHaveLength(inquiries.length);
    });

    describe("관리자 목록", () => {
      const all = { status: null, offset: 0, limit: 20 };

      it("findPage 는 받은 시각 최신순, 모든 필드 그대로", async () => {
        const repo = await setup(inquiries);
        expect(await repo.findPage(all)).toEqual([fresh, read, done]);
      });

      it.each([
        ["New", [fresh]],
        ["Read", [read, readEarlier]],
        ["Done", [done]],
      ] as const)("상태 필터 %s", async (status, expected) => {
        const repo = await setup([...inquiries, readEarlier]);
        expect(await repo.findPage({ ...all, status })).toEqual(expected);
      });

      it("offset/limit 으로 자른다. 끝을 넘으면 빈 목록", async () => {
        const repo = await setup(inquiries);
        expect(await repo.findPage({ ...all, offset: 1, limit: 1 })).toEqual([
          read,
        ]);
        expect(await repo.findPage({ ...all, offset: 2, limit: 5 })).toEqual([
          done,
        ]);
        expect(await repo.findPage({ ...all, offset: 3, limit: 5 })).toEqual(
          [],
        );
        expect(await repo.findPage({ ...all, offset: 50, limit: 5 })).toEqual(
          [],
        );
      });

      it("받은 시각이 같으면 id 역순이라 페이지 사이에서 빠지거나 겹치지 않는다", async () => {
        const twins = sameTime(5);
        const repo = await setup(twins);
        const pages = [];
        for (let offset = 0; offset < 5; offset += 2)
          pages.push(...(await repo.findPage({ ...all, offset, limit: 2 })));
        expect(pages.map((i) => i.id)).toEqual(
          twins.map((i) => i.id).reverse(),
        );
      });

      it("countByStatus 는 상태별 개수, 비어 있으면 0", async () => {
        expect(
          await (await setup([...inquiries, readEarlier])).countByStatus(),
        ).toEqual({ New: 1, Read: 2, Done: 1 });
        expect(await (await setup([])).countByStatus()).toEqual({
          New: 0,
          Read: 0,
          Done: 0,
        });
      });

      it("상태를 바꾸면 개수와 필터 결과가 바로 따라온다", async () => {
        const repo = await setup(inquiries);
        await repo.save({
          ...fresh,
          status: { type: "Read", changedAt: at("2026-10-24T00:00:00.000Z") },
        });
        expect(await repo.countByStatus()).toEqual({
          New: 0,
          Read: 2,
          Done: 1,
        });
        expect(await repo.findPage({ ...all, status: "New" })).toEqual([]);
      });

      it("1000건이 넘어도 개수와 마지막 페이지, findAll 이 잘리지 않는다 (PostgREST 응답 행 수 한도)", async () => {
        const bulk = sameTime(1005);
        const repo = await setup(bulk);
        expect(await repo.countByStatus()).toEqual({
          New: 1005,
          Read: 0,
          Done: 0,
        });
        const last = await repo.findPage({ ...all, offset: 1000, limit: 20 });
        expect(last.map((i) => i.id)).toEqual(
          bulk
            .slice(0, 5)
            .map((i) => i.id)
            .reverse(),
        );
        expect(await repo.findAll()).toHaveLength(1005);
      });
    });

    describe("지우기", () => {
      it("remove 는 지우고 true. findById, findAll, 개수에서 사라진다", async () => {
        const repo = await setup(inquiries);
        expect(await repo.remove(read.id)).toBe(true);
        expect(await repo.findById(read.id)).toBeNull();
        expect(byId(await repo.findAll())).toEqual(byId([fresh, done]));
        expect(await repo.countByStatus()).toEqual({
          New: 1,
          Read: 0,
          Done: 1,
        });
      });

      it.each([
        ["형식이 맞는 없는 id", "00000000-0000-4000-8000-0000000000ff"],
        ["형식이 다른 id", "nope"],
      ])("%s 는 false 이고 아무것도 지우지 않는다", async (_, id) => {
        const repo = await setup(inquiries);
        expect(await repo.remove(id as InquiryId)).toBe(false);
        expect(await repo.findAll()).toHaveLength(inquiries.length);
      });
    });
  });
}

const at = (iso: string) => new Date(iso);

const inquiry = (
  id: string,
  input: InquiryInput,
  receivedAt: Date,
  status: InquiryStatus,
): Inquiry => {
  const result = restoreInquiry(input, {
    id: id as InquiryId,
    receivedAt,
    status,
  });
  if (!result.ok)
    throw new Error(`계약 테스트 데이터 오류: ${result.error.type}`);
  return result.value;
};

// id 는 실제 저장소처럼 UUID (Supabase 의 id 칼럼은 uuid).
// 밀리초까지 있는 시각: 저장소가 시각을 잘라 먹지 않는지 본다 (Postgres timestamptz 는 마이크로초)
const fresh = inquiry(
  "00000000-0000-4000-8000-00000000c001",
  {
    firstName: "하늘",
    lastName: "김",
    email: "sky@example.com",
    phone: "+82 10-1234-5678",
    message: "가족사진 촬영 문의드립니다.",
  },
  at("2026-10-20T09:00:00.123Z"),
  { type: "New" },
);
const read = inquiry(
  "00000000-0000-4000-8000-00000000c002",
  {
    firstName: "Alex",
    lastName: "Morgan",
    email: "alex@example.com",
    message: "Wedding photography in May?",
  },
  at("2026-10-18T14:30:00.000Z"),
  { type: "Read", changedAt: at("2026-10-19T08:00:00.789Z") },
);
const done = inquiry(
  "00000000-0000-4000-8000-00000000c003",
  {
    firstName: "😀 이모지",
    lastName: "박",
    email: "park@example.co.kr",
    phone: "02-123-4567",
    message: "제품 촬영 견적 부탁드립니다.\n\n- 30컷\n- 흰 배경",
  },
  at("2026-10-01T00:00:00.000Z"),
  { type: "Done", changedAt: at("2026-10-02T23:59:59.999Z") },
);
// read 보다 먼저 받은 Read. 상태 필터 안에서도 최신순인지 본다
const readEarlier = inquiry(
  "00000000-0000-4000-8000-00000000c004",
  {
    firstName: "Jamie",
    lastName: "Lee",
    email: "jamie@example.com",
    message: "Studio rental?",
  },
  at("2026-10-05T10:00:00.000Z"),
  { type: "Read", changedAt: at("2026-10-06T10:00:00.000Z") },
);
const inquiries = [fresh, read, done];

// 같은 시각에 받은 문의 n 건 (id 오름차순)
const sameTime = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    inquiry(
      `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      {
        firstName: `손님${i + 1}`,
        lastName: "김",
        email: `guest${i + 1}@example.com`,
        message: "같은 시각 문의",
      },
      at("2026-10-10T10:00:00.000Z"),
      { type: "New" },
    ),
  );
const byId = (list: readonly Inquiry[]) =>
  [...list].sort((a, b) => a.id.localeCompare(b.id));
