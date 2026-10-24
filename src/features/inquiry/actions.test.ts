import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InquiryRepository } from "@/application/inquiry/inquiry-repository";
import type { Notifier } from "@/application/inquiry/notifier";
import type { Inquiry, InquiryId } from "@/domain/inquiry/inquiry";
import { initialInquiryFormState } from "./form-state";

// container 대신 가짜 포트를 꽂는다. server-only 는 테스트 환경에서 막히므로 비운다
const deps = vi.hoisted(() => ({
  saved: [] as Inquiry[],
  failSave: false,
  failNotify: false,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/infrastructure/container", () => {
  const repo: InquiryRepository = {
    save: async (inquiry) => {
      if (deps.failSave) throw new Error("db down");
      deps.saved.push(inquiry);
    },
    findById: async () => null,
    findAll: async () => deps.saved,
  };
  const notifier: Notifier = {
    notifyNewInquiry: async () => {
      if (deps.failNotify) throw new Error("slack 500");
    },
  };
  return {
    container: {
      inquiry: {
        repo,
        notifier,
        clock: { now: () => new Date("2026-10-24T09:00:00Z") },
        ids: { next: () => "inq-1" as InquiryId },
      },
    },
  };
});

const { submitInquiryAction } = await import("./actions");

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [name, value] of Object.entries(entries)) data.append(name, value);
  return data;
};

const valid = {
  firstName: " 하늘 ",
  lastName: "김",
  email: "Sky@Example.COM",
  phone: "",
  message: "가족사진 촬영 문의드립니다.\r\n주말 가능할까요?",
};

const submit = (entries: Record<string, string>) =>
  submitInquiryAction(initialInquiryFormState, form(entries));

describe("submitInquiryAction", () => {
  beforeEach(() => {
    deps.saved = [];
    deps.failSave = false;
    deps.failNotify = false;
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("정상 입력은 저장하고 성공 (정리는 schema, 검증과 다듬기는 domain)", async () => {
    expect(await submit(valid)).toEqual({ status: "success" });
    expect(deps.saved).toHaveLength(1);
    expect(deps.saved[0]).toMatchObject({
      id: "inq-1",
      firstName: "하늘",
      email: "Sky@example.com",
      phone: null,
      message: "가족사진 촬영 문의드립니다.\n주말 가능할까요?",
      status: { type: "New" },
    });
  });

  it("빈 제출은 필수 칸 네 개의 오류를 한 번에 돌려주고 저장하지 않는다", async () => {
    expect(await submit({})).toEqual({
      status: "invalid",
      values: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: "",
      },
      errors: {
        firstName: { code: "required" },
        lastName: { code: "required" },
        email: { code: "required" },
        message: { code: "required" },
      },
    });
    expect(deps.saved).toEqual([]);
  });

  it("틀린 칸이 있으면 입력값을 그대로 돌려준다", async () => {
    const entries = { ...valid, email: "nope", phone: "12" };
    expect(await submit(entries)).toEqual({
      status: "invalid",
      values: { ...entries, message: valid.message.replace("\r\n", "\n") },
      errors: {
        email: { code: "invalidEmail" },
        phone: { code: "invalidPhone" },
      },
    });
  });

  it("한도를 넘으면 tooLong 과 domain 한도", async () => {
    const state = await submit({ ...valid, message: "가".repeat(2001) });
    expect(state.status === "invalid" && state.errors).toEqual({
      message: { code: "tooLong", max: 2000 },
    });
  });

  it("알림이 실패해도 성공이고, 경고는 서버 로그에 문의 ID 와 함께 남긴다", async () => {
    deps.failNotify = true;
    expect(await submit(valid)).toEqual({ status: "success" });
    expect(deps.saved).toHaveLength(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringMatching(/NotificationFailed: 문의 inq-1/),
      new Error("slack 500"),
    );
  });

  it("저장이 실패하면 일시 오류와 입력값, 서버 로그에 원인", async () => {
    deps.failSave = true;
    const state = await submit(valid);
    expect(state).toMatchObject({ status: "error" });
    expect(state.status === "error" && state.values.firstName).toBe(" 하늘 ");
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/StorageFailed/),
      new Error("db down"),
    );
  });

  it("허니팟이 채워진 제출은 저장하지 않고 성공처럼 답한다", async () => {
    expect(await submit({ ...valid, website: "https://spam.test" })).toEqual({
      status: "success",
    });
    expect(deps.saved).toEqual([]);
  });

  it("로그에 입력값(이름, 이메일, 메시지)을 남기지 않는다", async () => {
    deps.failNotify = true;
    await submit(valid);
    deps.failSave = true;
    await submit(valid);
    const logged = JSON.stringify([
      vi.mocked(console.warn).mock.calls,
      vi.mocked(console.error).mock.calls,
    ]);
    for (const value of ["하늘", "Sky@", "가족사진"])
      expect(logged).not.toContain(value);
  });
});
