"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteInquiry,
  inquiryActions,
} from "@/application/inquiry/admin-inquiries";
import { changeInquiryStatus } from "@/application/inquiry/change-inquiry-status";
import { submitInquiry } from "@/application/inquiry/submit-inquiry";
import type { InquiryAction } from "@/domain/inquiry/status";
import { requireAdmin } from "@/features/admin-auth/queries";
import { container } from "@/infrastructure/container";
import {
  deleteRedirect,
  inquiryDetailHref,
  inquiryListHref,
  statusChangeRedirect,
} from "./admin-view";
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

// 관리자 문의 상태 바꾸기와 지우기 (19칸). 폼 POST(숨은 칸 id, action) → 결과를 주소의 notice 로 redirect.
// JS 가 없어도 결과 화면이 보이고(docs/adr/0013 의 동적 화면 제약), JS 가 있으면 같은 redirect 로 화면만 바뀐다 (docs/adr/0016).
// 데이터에 닿기 전에 관리자를 다시 확인하고(세션이 끝났으면 로그인 뒤 그 문의로), 저장소는 관리자 세션이라 RLS 도 막는다.
// 메뉴의 "새 문의 N건"과 목록 개수가 바로 맞도록 관리자 화면 전체의 라우터 캐시를 비운다.
// 서버 로그에는 문의 id 와 에러 종류만 남긴다 (이름, 이메일, 메시지는 남기지 않는다)

const formText = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

const isInquiryAction = (value: string): value is InquiryAction =>
  (inquiryActions as readonly string[]).includes(value);

export async function changeInquiryStatusAction(
  formData: FormData,
): Promise<never> {
  const id = formText(formData, "id");
  const action = formText(formData, "action");
  if (!id) redirect(inquiryListHref({ status: null, notice: "notFound" }));
  await requireAdmin(inquiryDetailHref(id));
  if (!isInquiryAction(action)) {
    console.warn(`[inquiry] 모르는 동작으로 문의 ${id} 상태 변경을 거절했다`);
    redirect(inquiryDetailHref(id, "malformed"));
  }

  const result = await changeInquiryStatus({
    repo: await container.inquiry.admin(),
    clock: container.inquiry.clock,
  })(id, action);
  if (!result.ok) {
    const { type } = result.error;
    if (type === "StorageFailed")
      console.error(
        `[inquiry] StorageFailed: 문의 ${id} 상태를 바꾸지 못했다`,
        result.error.cause,
      );
    else console.info(`[inquiry] ${type}: 문의 ${id} ${action} 거절`);
  }
  revalidatePath("/admin", "layout");
  redirect(statusChangeRedirect(id, action, result));
}

export async function deleteInquiryAction(formData: FormData): Promise<never> {
  const id = formText(formData, "id");
  if (!id) redirect(inquiryListHref({ status: null, notice: "notFound" }));
  await requireAdmin(inquiryDetailHref(id));

  const result = await deleteInquiry({
    repo: await container.inquiry.admin(),
  })(id);
  if (result.ok) console.info(`[inquiry] 문의 ${id} 를 지웠다`);
  else if (result.error.type === "StorageFailed")
    console.error(
      `[inquiry] StorageFailed: 문의 ${id} 를 지우지 못했다`,
      result.error.cause,
    );
  revalidatePath("/admin", "layout");
  redirect(deleteRedirect(id, result));
}
