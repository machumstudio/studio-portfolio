"use server";

import "server-only";
import { submitInquiry } from "@/application/inquiry/submit-inquiry";
import { container } from "@/infrastructure/container";
import { toInquiryFormState, type InquiryFormState } from "./form-state";
import {
  inquiryFieldNames,
  parseInquiryForm,
  type InquiryFormValues,
} from "./schema";

const emptyValues = Object.fromEntries(
  inquiryFieldNames.map((name) => [name, ""]),
) as InquiryFormValues;

// 문의 폼 제출. useActionState 로 부르고, JS 가 없을 때는 일반 POST 로 같은 함수가 불린다.
// FormData 정리(schema) → submitInquiry → 화면 상태. 서버 로그에는 문의 ID 와 원인만 남긴다 (입력값은 남기지 않는다)
export async function submitInquiryAction(
  _previous: InquiryFormState,
  formData: FormData,
): Promise<InquiryFormState> {
  const parsed = parseInquiryForm(formData);
  if (!parsed.ok) {
    console.warn("[inquiry] 폼 형태가 아닌 제출을 거절했다");
    return { status: "error", values: emptyValues };
  }
  const { values, isBot } = parsed.value;
  // 허니팟이 채워진 제출은 저장하지 않고 성공처럼 답한다. 실패로 답하면 자동 제출기가 칸을 바꿔 다시 시도한다
  if (isBot) {
    console.warn("[inquiry] 허니팟 칸이 채워진 제출을 버렸다");
    return { status: "success" };
  }

  const result = await submitInquiry(container.inquiry)(values);
  if (result.ok) {
    for (const warning of result.value.warnings)
      console.warn(
        `[inquiry] ${warning.type}: 문의 ${result.value.inquiry.id} 는 저장됐지만 알림을 보내지 못했다`,
        warning.cause,
      );
  } else if (result.error.type === "StorageFailed") {
    console.error(
      "[inquiry] StorageFailed: 문의를 저장하지 못했다",
      result.error.cause,
    );
  }
  return toInquiryFormState(result, values);
}
