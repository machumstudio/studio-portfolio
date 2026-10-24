import { describe, expect, it } from "vitest";
import type {
  Inquiry,
  InquiryId,
  InquiryInput,
} from "@/domain/inquiry/inquiry";
import { err } from "@/shared/result";
import type { Clock, InquiryIdGenerator } from "./clock";
import type { InquiryRepository } from "./inquiry-repository";
import type { Notifier } from "./notifier";
import { submitInquiry } from "./submit-inquiry";

// 포트만 지키는 가짜들. application 은 infrastructure 를 import 할 수 없어 여기 둔다
const now = new Date("2026-10-24T09:00:00Z");
const clock: Clock = { now: () => now };
const ids = (): InquiryIdGenerator => {
  let n = 0;
  return { next: () => `inq-${++n}` as InquiryId };
};
const memoryRepo = (failSave = false) => {
  const store = new Map<InquiryId, Inquiry>();
  const repo: InquiryRepository = {
    save: async (inquiry) => {
      if (failSave) throw new Error("db down");
      store.set(inquiry.id, inquiry);
    },
    findById: async (id) => store.get(id) ?? null,
    findAll: async () => [...store.values()],
  };
  return { repo, store };
};
const recordingNotifier = (failWith?: Error) => {
  const sent: Inquiry[] = [];
  const notifier: Notifier = {
    notifyNewInquiry: async (inquiry) => {
      if (failWith) throw failWith;
      sent.push(inquiry);
    },
  };
  return { notifier, sent };
};

const input: InquiryInput = {
  firstName: "하늘",
  lastName: "김",
  email: "sky@example.com",
  message: "가족사진 촬영 문의드립니다.",
};

describe("submitInquiry", () => {
  it("검증 → 저장 → 알림 순서로 New 문의를 접수한다", async () => {
    const { repo, store } = memoryRepo();
    const { notifier, sent } = recordingNotifier();

    const result = await submitInquiry({ repo, notifier, clock, ids: ids() })(
      input,
    );

    expect(result.ok && result.value.warnings).toEqual([]);
    const inquiry = result.ok ? result.value.inquiry : null;
    expect(inquiry).toMatchObject({
      id: "inq-1",
      receivedAt: now,
      phone: null,
      status: { type: "New" },
    });
    expect(store.get("inq-1" as InquiryId)).toEqual(inquiry);
    expect(sent).toEqual([inquiry]);
  });

  it("알림이 실패해도 저장은 유지하고 결과에 경고를 남긴다", async () => {
    const { repo, store } = memoryRepo();
    const cause = new Error("slack 500");
    const { notifier } = recordingNotifier(cause);

    const result = await submitInquiry({ repo, notifier, clock, ids: ids() })(
      input,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.warnings).toEqual([
      { type: "NotificationFailed", cause },
    ]);
    expect(store.get(result.value.inquiry.id)).toEqual(result.value.inquiry);
  });

  it("입력이 틀리면 저장도 알림도 하지 않고 칸별 에러를 돌려준다", async () => {
    const { repo, store } = memoryRepo();
    const { notifier, sent } = recordingNotifier();

    const result = await submitInquiry({ repo, notifier, clock, ids: ids() })({
      ...input,
      email: "nope",
    });

    expect(result).toEqual(
      err({
        type: "InvalidInquiry",
        fields: { email: { type: "InvalidEmail" } },
      }),
    );
    expect(store.size).toBe(0);
    expect(sent).toEqual([]);
  });

  it("저장이 실패하면 StorageFailed 이고 알림을 보내지 않는다", async () => {
    const { repo } = memoryRepo(true);
    const { notifier, sent } = recordingNotifier();

    const result = await submitInquiry({ repo, notifier, clock, ids: ids() })(
      input,
    );

    expect(result).toEqual(
      err({ type: "StorageFailed", cause: new Error("db down") }),
    );
    expect(sent).toEqual([]);
  });

  it("제출마다 새 ID 로 따로 저장한다", async () => {
    const { repo, store } = memoryRepo();
    const { notifier } = recordingNotifier();
    const submit = submitInquiry({ repo, notifier, clock, ids: ids() });

    await submit(input);
    await submit(input);

    expect([...store.keys()]).toEqual(["inq-1", "inq-2"]);
  });
});
