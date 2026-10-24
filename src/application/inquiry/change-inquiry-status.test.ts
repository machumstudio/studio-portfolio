import { describe, expect, it, vi } from "vitest";
import {
  createInquiry,
  type Inquiry,
  type InquiryId,
} from "@/domain/inquiry/inquiry";
import type { InquiryStatus } from "@/domain/inquiry/status";
import { err, ok } from "@/shared/result";
import { changeInquiryStatus } from "./change-inquiry-status";
import type { Clock } from "./clock";
import type { InquiryRepository } from "./inquiry-repository";

const receivedAt = new Date("2026-10-01T09:00:00Z");
const now = new Date("2026-10-24T09:00:00Z");
const clock: Clock = { now: () => now };

const inquiry = (id: string, status: InquiryStatus): Inquiry => {
  const result = createInquiry(
    {
      firstName: "하늘",
      lastName: "김",
      email: "sky@example.com",
      message: "촬영 문의",
    },
    { id: id as InquiryId, receivedAt },
  );
  if (!result.ok) throw new Error(result.error.type);
  return { ...result.value, status };
};

// 포트만 지키는 인메모리 가짜
const memoryRepo = (inquiries: Inquiry[]) => {
  const store = new Map(inquiries.map((i) => [i.id, i]));
  const repo: InquiryRepository = {
    save: async (i) => void store.set(i.id, i),
    findById: async (id) => store.get(id) ?? null,
    findAll: async () => [...store.values()],
  };
  return { repo, store };
};

const fresh = inquiry("inq-1", { type: "New" });
const done = inquiry("inq-2", { type: "Done", changedAt: receivedAt });

describe("changeInquiryStatus", () => {
  it("조회 → 전이 → 저장하고 바뀐 문의를 돌려준다 (시각은 Clock)", async () => {
    const { repo, store } = memoryRepo([fresh]);

    const result = await changeInquiryStatus({ repo, clock })(
      "inq-1",
      "markRead",
    );

    const expected = { ...fresh, status: { type: "Read", changedAt: now } };
    expect(result).toEqual(ok(expected));
    expect(store.get(fresh.id)).toEqual(expected);
  });

  it("되돌리기 Done → Read", async () => {
    const { repo } = memoryRepo([done]);
    expect(
      await changeInquiryStatus({ repo, clock })("inq-2", "reopen"),
    ).toEqual(ok({ ...done, status: { type: "Read", changedAt: now } }));
  });

  it("없는 ID 는 NotFound", async () => {
    const { repo } = memoryRepo([fresh]);
    expect(
      await changeInquiryStatus({ repo, clock })("nope", "markRead"),
    ).toEqual(err({ type: "NotFound", id: "nope" }));
  });

  it("빈 ID 는 저장소에 묻지 않고 NotFound", async () => {
    const { repo } = memoryRepo([fresh]);
    const findById = vi.fn(repo.findById);
    expect(
      await changeInquiryStatus({ repo: { ...repo, findById }, clock })(
        " ",
        "markRead",
      ),
    ).toEqual(err({ type: "NotFound", id: " " }));
    expect(findById).not.toHaveBeenCalled();
  });

  it("허용 안 된 전이는 InvalidTransition 이고 저장하지 않는다", async () => {
    const { repo, store } = memoryRepo([fresh]);
    const save = vi.fn(repo.save);

    expect(
      await changeInquiryStatus({ repo: { ...repo, save }, clock })(
        "inq-1",
        "markDone",
      ),
    ).toEqual(
      err({ type: "InvalidTransition", from: "New", action: "markDone" }),
    );
    expect(save).not.toHaveBeenCalled();
    expect(store.get(fresh.id)).toEqual(fresh);
  });

  it.each([
    ["조회", { findById: () => Promise.reject(new Error("db down")) }],
    ["저장", { save: () => Promise.reject(new Error("db down")) }],
  ])("%s 실패는 StorageFailed", async (_, broken) => {
    const { repo } = memoryRepo([fresh]);
    expect(
      await changeInquiryStatus({ repo: { ...repo, ...broken }, clock })(
        "inq-1",
        "markRead",
      ),
    ).toEqual(err({ type: "StorageFailed", cause: new Error("db down") }));
  });
});
