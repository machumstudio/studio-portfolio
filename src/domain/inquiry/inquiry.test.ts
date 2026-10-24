import { describe, expect, it } from "vitest";
import { err, ok } from "@/shared/result";
import {
  transitionInquiry,
  createInquiry,
  parseInquiryId,
  type Inquiry,
  type InquiryId,
  type InquiryInput,
} from "./inquiry";

const id = "inq-1" as InquiryId;
const receivedAt = new Date("2026-10-01T09:00:00Z");
const meta = { id, receivedAt };

const valid: InquiryInput = {
  firstName: " 하늘 ",
  lastName: "김",
  email: "Sky@Example.COM",
  phone: "010-1234-5678",
  message: "  가족사진 촬영 문의드립니다.\n주말 가능할까요?  ",
};

const created = (input: InquiryInput = valid): Inquiry => {
  const result = createInquiry(input, meta);
  if (!result.ok) throw new Error(result.error.type);
  return result.value;
};

describe("createInquiry", () => {
  it("값을 정리해 New 상태의 문의를 만든다", () => {
    expect(createInquiry(valid, meta)).toEqual(
      ok({
        id,
        firstName: "하늘",
        lastName: "김",
        email: "Sky@example.com",
        phone: "010-1234-5678",
        message: "가족사진 촬영 문의드립니다.\n주말 가능할까요?",
        receivedAt,
        status: { type: "New" },
      }),
    );
  });

  it.each([undefined, "", "  "])("연락처 %j 는 null 로 둔다", (phone) => {
    expect(created({ ...valid, phone }).phone).toBeNull();
  });

  it("틀린 칸을 모두 칸별로 모아 돌려준다", () => {
    expect(
      createInquiry(
        {
          firstName: "",
          lastName: "가".repeat(51),
          email: "not-an-email",
          phone: "123",
          message: " ",
        },
        meta,
      ),
    ).toEqual(
      err({
        type: "InvalidInquiry",
        fields: {
          firstName: { type: "Required" },
          lastName: { type: "TooLong", max: 50 },
          email: { type: "InvalidEmail" },
          phone: { type: "InvalidPhone" },
          message: { type: "Required" },
        },
      }),
    );
  });

  it("틀린 칸 하나만 있으면 그 칸만", () => {
    expect(createInquiry({ ...valid, email: "" }, meta)).toEqual(
      err({ type: "InvalidInquiry", fields: { email: { type: "Required" } } }),
    );
  });
});

describe("transitionInquiry", () => {
  const at = new Date("2026-10-02T10:00:00Z");

  it("상태만 바꾸고 나머지 필드는 그대로", () => {
    const inquiry = created();
    expect(transitionInquiry(inquiry, "markRead", at)).toEqual(
      ok({ ...inquiry, status: { type: "Read", changedAt: at } }),
    );
    expect(inquiry.status).toEqual({ type: "New" });
  });

  it("허용 안 된 전이는 InvalidTransition (전이표 전체는 status.test.ts)", () => {
    expect(transitionInquiry(created(), "markDone", at)).toEqual(
      err({ type: "InvalidTransition", from: "New", action: "markDone" }),
    );
  });
});

describe("parseInquiryId", () => {
  it("앞뒤 공백을 지운다", () => {
    expect(parseInquiryId(" inq-1 ")).toEqual(ok("inq-1"));
  });

  it.each(["", "  "])("빈 값 %j 는 InvalidInquiryId", (value) => {
    expect(parseInquiryId(value)).toEqual(
      err({ type: "InvalidInquiryId", value }),
    );
  });
});
