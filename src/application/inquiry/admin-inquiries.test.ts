import { describe, expect, it, vi } from "vitest";
import {
  createInquiry,
  type Inquiry,
  type InquiryId,
} from "@/domain/inquiry/inquiry";
import type { InquiryStatus } from "@/domain/inquiry/status";
import { err, ok } from "@/shared/result";
import type { AdminInquiryRepository } from "./admin-inquiry-repository";
import {
  countInquiries,
  deleteInquiry,
  getInquiry,
  inquiryPageSize,
  listInquiries,
} from "./admin-inquiries";

const changedAt = new Date("2026-10-24T09:00:00Z");

// n 번째 문의일수록 늦게 받았다
const inquiry = (n: number, status: InquiryStatus = { type: "New" }) => {
  const result = createInquiry(
    {
      firstName: `손님${n}`,
      lastName: "김",
      email: `guest${n}@example.com`,
      message: "촬영 문의",
    },
    {
      id: `inq-${String(n).padStart(3, "0")}` as InquiryId,
      receivedAt: new Date(Date.UTC(2026, 9, 1, 0, n)),
    },
  );
  if (!result.ok) throw new Error(result.error.type);
  return { ...result.value, status };
};

// 포트만 지키는 인메모리 가짜. 호출을 기록해 범위 조회 인자를 확인한다
const memoryRepo = (inquiries: Inquiry[]) => {
  const store = new Map(inquiries.map((i) => [i.id, i]));
  const newest = () =>
    [...store.values()].sort(
      (a, b) =>
        b.receivedAt.getTime() - a.receivedAt.getTime() ||
        b.id.localeCompare(a.id),
    );
  const repo: AdminInquiryRepository = {
    save: async (i) => void store.set(i.id, i),
    findById: async (id) => store.get(id) ?? null,
    findAll: async () => [...store.values()],
    countByStatus: async () => {
      const counts = { New: 0, Read: 0, Done: 0 };
      for (const i of store.values()) counts[i.status.type] += 1;
      return counts;
    },
    findPage: vi.fn(async ({ status, offset, limit }) =>
      newest()
        .filter((i) => !status || i.status.type === status)
        .slice(offset, offset + limit),
    ),
    remove: async (id) => store.delete(id),
  };
  return { repo, store };
};

const many = (count: number, status?: InquiryStatus) =>
  Array.from({ length: count }, (_, i) => inquiry(i + 1, status));

describe("listInquiries", () => {
  it("최신순 첫 페이지와 상태별 개수, 전체 수", async () => {
    const { repo } = memoryRepo([
      inquiry(1),
      inquiry(2, { type: "Read", changedAt }),
      inquiry(3, { type: "Done", changedAt }),
      inquiry(4),
    ]);
    const list = await listInquiries({ repo })({ status: null, page: 1 });
    expect(list.items.map((i) => i.id)).toEqual([
      "inq-004",
      "inq-003",
      "inq-002",
      "inq-001",
    ]);
    expect(list).toMatchObject({
      counts: { New: 2, Read: 1, Done: 1 },
      total: 4,
      status: null,
      page: 1,
      pageCount: 1,
    });
  });

  it("상태 필터: 그 상태만, 페이지 수는 그 상태의 개수로", async () => {
    const { repo } = memoryRepo([
      ...many(inquiryPageSize + 1),
      inquiry(100, { type: "Done", changedAt }),
    ]);
    const done = await listInquiries({ repo })({ status: "Done", page: 1 });
    expect(done.items.map((i) => i.id)).toEqual(["inq-100"]);
    expect(done.pageCount).toBe(1);
    const fresh = await listInquiries({ repo })({ status: "New", page: 1 });
    expect(fresh.pageCount).toBe(2);
    expect(fresh.total).toBe(inquiryPageSize + 2);
  });

  it("페이지는 저장소에서 범위로 읽는다 (전체를 읽지 않는다)", async () => {
    const { repo } = memoryRepo(many(inquiryPageSize * 2 + 5));
    const findAll = vi.fn(repo.findAll);
    const list = await listInquiries({ repo: { ...repo, findAll } })({
      status: null,
      page: 3,
    });
    expect(repo.findPage).toHaveBeenCalledWith({
      status: null,
      offset: inquiryPageSize * 2,
      limit: inquiryPageSize,
    });
    expect(list.items).toHaveLength(5);
    expect(list.items[0]?.id).toBe("inq-005");
    expect(list).toMatchObject({ page: 3, pageCount: 3 });
    expect(findAll).not.toHaveBeenCalled();
  });

  it.each([
    ["마지막보다 뒤 (지운 뒤 사라진 페이지)", 9, 2],
    ["0", 0, 1],
    ["음수", -3, 1],
    ["정수가 아님", 1.5, 1],
    ["NaN", Number.NaN, 1],
  ])("범위를 벗어난 페이지(%s)는 가까운 페이지로", async (_, page, shown) => {
    const { repo } = memoryRepo(many(inquiryPageSize + 1));
    const list = await listInquiries({ repo })({ status: null, page });
    expect(list.page).toBe(shown);
    expect(list.items.length).toBeGreaterThan(0);
  });

  it("문의가 없으면 저장소에 페이지를 묻지 않고 빈 페이지 하나", async () => {
    const { repo } = memoryRepo([]);
    const list = await listInquiries({ repo })({ status: "Read", page: 4 });
    expect(list).toEqual({
      items: [],
      counts: { New: 0, Read: 0, Done: 0 },
      total: 0,
      status: "Read",
      page: 1,
      pageCount: 1,
    });
    expect(repo.findPage).not.toHaveBeenCalled();
  });

  it("저장소 장애는 그대로 거부한다 (화면의 오류 화면)", async () => {
    const { repo } = memoryRepo([inquiry(1)]);
    await expect(
      listInquiries({
        repo: { ...repo, countByStatus: () => Promise.reject(new Error("db")) },
      })({ status: null, page: 1 }),
    ).rejects.toThrow("db");
  });
});

describe("countInquiries", () => {
  it("상태별 개수", async () => {
    const { repo } = memoryRepo([
      inquiry(1),
      inquiry(2),
      inquiry(3, { type: "Read", changedAt }),
    ]);
    expect(await countInquiries({ repo })()).toEqual({
      New: 2,
      Read: 1,
      Done: 0,
    });
  });
});

describe("getInquiry", () => {
  it("있으면 문의, 없거나 빈 id 는 null", async () => {
    const one = inquiry(1);
    const { repo } = memoryRepo([one]);
    expect(await getInquiry({ repo })("inq-001")).toEqual(one);
    expect(await getInquiry({ repo })("inq-999")).toBeNull();
    expect(await getInquiry({ repo })("  ")).toBeNull();
  });
});

describe("deleteInquiry", () => {
  it("지우면 저장소에서 사라진다", async () => {
    const { repo, store } = memoryRepo([inquiry(1), inquiry(2)]);
    expect(await deleteInquiry({ repo })("inq-001")).toEqual(ok(undefined));
    expect([...store.keys()]).toEqual(["inq-002"]);
  });

  it("이미 없으면 (다른 탭에서 지움) NotFound", async () => {
    const { repo } = memoryRepo([inquiry(1)]);
    await deleteInquiry({ repo })("inq-001");
    expect(await deleteInquiry({ repo })("inq-001")).toEqual(
      err({ type: "NotFound", id: "inq-001" }),
    );
  });

  it("빈 id 는 저장소에 묻지 않고 NotFound", async () => {
    const { repo } = memoryRepo([inquiry(1)]);
    const remove = vi.fn(repo.remove);
    expect(await deleteInquiry({ repo: { ...repo, remove } })(" ")).toEqual(
      err({ type: "NotFound", id: " " }),
    );
    expect(remove).not.toHaveBeenCalled();
  });

  it("저장소 장애는 StorageFailed", async () => {
    const { repo } = memoryRepo([inquiry(1)]);
    const cause = new Error("db down");
    expect(
      await deleteInquiry({
        repo: { ...repo, remove: () => Promise.reject(cause) },
      })("inq-001"),
    ).toEqual(err({ type: "StorageFailed", cause }));
  });
});
