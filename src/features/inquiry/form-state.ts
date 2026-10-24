import type {
  SubmitInquiryError,
  SubmitInquiryResult,
} from "@/application/inquiry/submit-inquiry";
import type { InquiryFieldErrors } from "@/domain/inquiry/inquiry";
import { assertNever } from "@/shared/assert-never";
import type { Result } from "@/shared/result";
import {
  inquiryFieldNames,
  type InquiryFieldName,
  type InquiryFormValues,
} from "./schema";

// 화면이 번역할 칸별 오류 코드. 메시지 키는 InquiryForm.errors.<칸>.<code>
export type InquiryFieldError =
  | { code: "required" }
  | { code: "tooLong"; max: number }
  | { code: "invalidEmail" }
  | { code: "invalidPhone" };

export type InquiryFormErrors = Partial<
  Record<InquiryFieldName, InquiryFieldError>
>;

// 서버 액션이 돌려주는 폼 상태. 오류일 때는 입력값을 같이 돌려줘 JS 없이 다시 그려도 값이 남는다
export type InquiryFormState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "invalid";
      values: InquiryFormValues;
      errors: InquiryFormErrors;
    }
  | { status: "error"; values: InquiryFormValues };

export const initialInquiryFormState: InquiryFormState = { status: "idle" };

type DomainFieldError = NonNullable<
  InquiryFieldErrors[keyof InquiryFieldErrors]
>;

function toFieldError(error: DomainFieldError): InquiryFieldError {
  switch (error.type) {
    case "Required":
      return { code: "required" };
    case "TooLong":
      return { code: "tooLong", max: error.max };
    case "InvalidEmail":
      return { code: "invalidEmail" };
    case "InvalidPhone":
      return { code: "invalidPhone" };
    default:
      return assertNever(error);
  }
}

/** domain 의 칸별 오류를 화면 코드로. 칸 순서는 폼 순서 */
export function toFormErrors(fields: InquiryFieldErrors): InquiryFormErrors {
  return Object.fromEntries(
    inquiryFieldNames.flatMap((name) => {
      const error = fields[name];
      return error ? [[name, toFieldError(error)]] : [];
    }),
  );
}

/** 폼 순서로 첫 오류 칸. 제출 후 포커스를 옮길 곳 */
export const firstErrorField = (
  errors: InquiryFormErrors,
): InquiryFieldName | undefined =>
  inquiryFieldNames.find((name) => errors[name]);

// 유스케이스 결과 → 화면 상태: 성공 / 칸별 오류 / 일시 오류.
// 알림 실패 경고(NotificationFailed)는 저장이 됐으므로 사용자에게는 성공이다 (docs/adr/0007)
export function toInquiryFormState(
  result: Result<SubmitInquiryResult, SubmitInquiryError>,
  values: InquiryFormValues,
): InquiryFormState {
  if (result.ok) return { status: "success" };
  switch (result.error.type) {
    case "InvalidInquiry":
      return {
        status: "invalid",
        values,
        errors: toFormErrors(result.error.fields),
      };
    case "StorageFailed":
      return { status: "error", values };
    default:
      return assertNever(result.error);
  }
}
