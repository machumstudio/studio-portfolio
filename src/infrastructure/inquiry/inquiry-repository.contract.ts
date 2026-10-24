import { describe, expect, it } from "vitest";
import type { InquiryRepository } from "@/application/inquiry/inquiry-repository";
import {
  createInquiry,
  type Inquiry,
  type InquiryId,
  type InquiryInput,
} from "@/domain/inquiry/inquiry";
import type { InquiryStatus } from "@/domain/inquiry/status";

// InquiryRepository 계약 테스트. 구현마다 *.test.ts 에서 불러 같은 시나리오를 돌린다:
//   describeInquiryRepositoryContract("인메모리", (inquiries) => createInMemoryInquiryRepository(inquiries));
// setup 은 테스트마다 inquiries 만 들어 있는 새 저장소를 돌려준다 (Supabase 는 테이블을 비우고 넣는다)
export function describeInquiryRepositoryContract(
  name: string,
  setup: (
    inquiries: readonly Inquiry[],
  ) => InquiryRepository | Promise<InquiryRepository>,
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

    it("없는 id 는 null", async () => {
      const repo = await setup(inquiries);
      expect(await repo.findById("nope" as InquiryId)).toBeNull();
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
  });
}

const at = (iso: string) => new Date(iso);

const inquiry = (
  id: string,
  input: InquiryInput,
  receivedAt: Date,
  status: InquiryStatus,
): Inquiry => {
  const result = createInquiry(input, { id: id as InquiryId, receivedAt });
  if (!result.ok)
    throw new Error(`계약 테스트 데이터 오류: ${result.error.type}`);
  return { ...result.value, status };
};

// 밀리초까지 있는 시각: 저장소가 시각을 잘라 먹지 않는지 본다 (Postgres timestamptz 는 마이크로초)
const fresh = inquiry(
  "contract-fresh",
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
  "contract-read",
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
  "contract-done",
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
const inquiries = [fresh, read, done];
const byId = (list: readonly Inquiry[]) =>
  [...list].sort((a, b) => a.id.localeCompare(b.id));
