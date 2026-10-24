import { describe, expect, it } from "vitest";
import type { Inquiry } from "@/domain/inquiry/inquiry";
import { err, ok } from "@/shared/result";
import {
  firstErrorField,
  toFormErrors,
  toInquiryFormState,
} from "./form-state";
import type { InquiryFormValues } from "./schema";

const values: InquiryFormValues = {
  firstName: "",
  lastName: "김",
  email: "nope",
  phone: "12",
  message: "촬영 문의",
};

describe("toFormErrors", () => {
  it("domain 오류 종류를 칸별 코드로 바꾸고 한도는 그대로 넘긴다", () => {
    expect(
      toFormErrors({
        firstName: { type: "Required" },
        lastName: { type: "TooLong", max: 50 },
        email: { type: "InvalidEmail" },
        phone: { type: "InvalidPhone" },
        message: { type: "TooLong", max: 2000 },
      }),
    ).toEqual({
      firstName: { code: "required" },
      lastName: { code: "tooLong", max: 50 },
      email: { code: "invalidEmail" },
      phone: { code: "invalidPhone" },
      message: { code: "tooLong", max: 2000 },
    });
  });

  it("틀린 칸만 남긴다", () => {
    expect(toFormErrors({ email: { type: "Required" } })).toEqual({
      email: { code: "required" },
    });
  });
});

describe("firstErrorField", () => {
  it("폼 순서로 첫 오류 칸", () => {
    expect(
      firstErrorField({
        message: { code: "required" },
        email: { code: "invalidEmail" },
      }),
    ).toBe("email");
    expect(firstErrorField({})).toBeUndefined();
  });
});

describe("toInquiryFormState", () => {
  const inquiry = {} as Inquiry;

  it("저장되면 성공", () => {
    expect(toInquiryFormState(ok({ inquiry, warnings: [] }), values)).toEqual({
      status: "success",
    });
  });

  it("알림이 실패해도 저장됐으면 사용자에게는 성공", () => {
    expect(
      toInquiryFormState(
        ok({
          inquiry,
          warnings: [{ type: "NotificationFailed", cause: new Error("x") }],
        }),
        values,
      ),
    ).toEqual({ status: "success" });
  });

  it("입력 오류는 칸별 오류와 입력값", () => {
    expect(
      toInquiryFormState(
        err({
          type: "InvalidInquiry",
          fields: {
            firstName: { type: "Required" },
            email: { type: "InvalidEmail" },
          },
        }),
        values,
      ),
    ).toEqual({
      status: "invalid",
      values,
      errors: {
        firstName: { code: "required" },
        email: { code: "invalidEmail" },
      },
    });
  });

  it("저장 실패는 일시 오류이고 입력값을 돌려준다", () => {
    expect(
      toInquiryFormState(
        err({ type: "StorageFailed", cause: new Error("db down") }),
        values,
      ),
    ).toEqual({ status: "error", values });
  });
});
