import { describe, expect, it, vi } from "vitest";
import { createInquiry, type InquiryId } from "@/domain/inquiry/inquiry";
import { createLogNotifier } from "./log-notifier";

const created = createInquiry(
  {
    firstName: "하늘",
    lastName: "김",
    email: "sky@example.com",
    phone: "010-0000-0000",
    message: "가족사진 촬영 문의드립니다.",
  },
  {
    id: "inq-1" as InquiryId,
    receivedAt: new Date("2026-10-24T09:00:00Z"),
  },
);
if (!created.ok) throw new Error(created.error.type);
const inquiry = created.value;

describe("createLogNotifier", () => {
  it("문의 ID 와 접수 시각만 한 줄로 남긴다", async () => {
    const log = vi.fn();
    await createLogNotifier(log).notifyNewInquiry(inquiry);
    expect(log).toHaveBeenCalledExactlyOnceWith(
      "[inquiry] 새 문의 inq-1 (2026-10-24T09:00:00.000Z)",
    );
  });

  it("이름, 이메일, 연락처, 메시지는 로그에 없다", async () => {
    const log = vi.fn();
    await createLogNotifier(log).notifyNewInquiry(inquiry);
    const line = String(log.mock.calls[0][0]);
    for (const value of [
      inquiry.firstName,
      inquiry.email,
      inquiry.phone,
      inquiry.message,
    ])
      expect(line).not.toContain(value);
  });
});
