import { describe, expect, it } from "vitest";
import { restoreInquiry, type InquiryId } from "@/domain/inquiry/inquiry";
import type { InquiryStatus } from "@/domain/inquiry/status";
import { err, ok } from "@/shared/result";
import type { InquiryRow } from "../supabase/database";
import { toInquiry, toInquiryRow } from "./supabase-inquiry-mapper";

const id = "5b0c6f1e-3f6a-4a52-9a8e-0d2c1f6b7a10";
const changedAt = "2026-10-21T08:00:00.789Z";

const inquiry = (status: InquiryStatus) => {
  const result = restoreInquiry(
    {
      firstName: "하늘",
      lastName: "김",
      email: "sky@example.com",
      message: "가족사진 촬영 문의드립니다.\n주말 가능할까요?",
    },
    {
      id: id as InquiryId,
      receivedAt: new Date("2026-10-20T09:00:00.123Z"),
      status,
    },
  );
  if (!result.ok) throw new Error(result.error.type);
  return result.value;
};

const row: InquiryRow = {
  id,
  first_name: "하늘",
  last_name: "김",
  email: "sky@example.com",
  phone: null,
  message: "가족사진 촬영 문의드립니다.\n주말 가능할까요?",
  received_at: "2026-10-20T09:00:00.123Z",
  status: "new",
  status_changed_at: null,
};

describe("toInquiryRow", () => {
  it.each([
    [{ type: "New" } as const, "new", null],
    [
      { type: "Read", changedAt: new Date(changedAt) } as const,
      "read",
      changedAt,
    ],
    [
      { type: "Done", changedAt: new Date(changedAt) } as const,
      "done",
      changedAt,
    ],
  ])("상태 %o → status %s, status_changed_at %s", (status, column, at) => {
    expect(toInquiryRow(inquiry(status))).toEqual({
      ...row,
      status: column,
      status_changed_at: at,
    });
  });

  it("연락처를 넣지 않았으면 null 로 둔다 (빈 문자열 아님)", () => {
    expect(toInquiryRow(inquiry({ type: "New" })).phone).toBeNull();
  });
});

describe("toInquiry", () => {
  it.each<InquiryStatus>([
    { type: "New" },
    { type: "Read", changedAt: new Date(changedAt) },
    { type: "Done", changedAt: new Date(changedAt) },
  ])("toInquiryRow 의 반대: $type", (status) => {
    expect(toInquiry(toInquiryRow(inquiry(status)))).toEqual(
      ok(inquiry(status)),
    );
  });

  it("Postgres 가 돌려주는 +00:00 형식의 시각도 읽는다", () => {
    const restored = toInquiry({
      ...row,
      received_at: "2026-10-20T09:00:00.123+00:00",
    });
    expect(restored.ok && restored.value.receivedAt).toEqual(
      new Date("2026-10-20T09:00:00.123Z"),
    );
  });

  it.each([
    ["new 인데 시각 있음", "new", changedAt],
    ["read 인데 시각 없음", "read", null],
    ["모르는 상태", "archived", changedAt],
  ])("%s 은 InvalidStoredStatus", (_, status, at) => {
    expect(toInquiry({ ...row, status, status_changed_at: at })).toEqual(
      err({ type: "InvalidStoredStatus", status, hasChangedAt: at !== null }),
    );
  });

  it("칸 규칙을 어긴 행은 restoreInquiry 의 에러", () => {
    expect(toInquiry({ ...row, email: "not-an-email" })).toEqual(
      err({
        type: "InvalidInquiry",
        fields: { email: { type: "InvalidEmail" } },
      }),
    );
  });
});
