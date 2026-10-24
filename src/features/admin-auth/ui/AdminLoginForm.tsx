"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, type FormEvent } from "react";
import { buttonStyles } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { Field, Input } from "@/components/ui/Field";
import { initialAdminLoginState, type AdminLoginState } from "../form-state";
import type { LoginFieldName } from "../schema";

type AdminLoginAction = (
  state: AdminLoginState,
  formData: FormData,
) => Promise<AdminLoginState>;

type AdminLoginFormProps = {
  /** 페이지가 서버 액션(signInAction)을 넘긴다. 스토리와 테스트는 가짜를 넘긴다 */
  action: AdminLoginAction;
  /** 스토리에서 실패 화면을 바로 보여 줄 때 */
  initialState?: AdminLoginState;
};

// 관리자 로그인 폼. 13칸 문의 폼(InquiryForm)과 같은 방식:
// - JS 가 없으면 일반 POST 로 서버 액션이 불리고, 성공하면 서버가 redirect, 실패하면 서버가 다시 그린다
// - 실패 문구는 하나다 (없는 이메일, 틀린 비밀번호, 관리자 아님을 구분하지 않는다). role=status 로 알리고
//   두 칸 모두 aria-invalid + aria-describedby 로 문구를 잇는다.
//   액션이 끝나면 React 가 폼을 기본값으로 되돌린다: 이메일은 서버가 돌려준 값, 비밀번호는 빈 칸
// - 실패 뒤 포커스: 이메일이 비었으면 이메일, 아니면 비밀번호 (JS 는 effect, JS 없으면 autoFocus)
// - 제출 중에는 버튼을 aria-disabled 로 막고 submit 을 무시한다 (disabled 는 포커스를 잃게 해서 쓰지 않는다)
// - 가입, 비밀번호 찾기 링크는 두지 않는다 (공개 가입 꺼짐. 계정은 Supabase 대시보드에서 관리)
// 시안에 없는 화면이라 기존 Field / primary 버튼 / 토큰만 쓴다
export function AdminLoginForm({
  action,
  initialState = initialAdminLoginState,
}: AdminLoginFormProps) {
  const t = useTranslations("AdminLogin");
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const failed = state.status === "error";
  const email = failed ? state.email : "";
  const focusField: LoginFieldName | undefined = failed
    ? email
      ? "password"
      : "email"
    : undefined;

  // 새 결과가 올 때마다 (같은 실패가 반복돼도)
  useEffect(() => {
    if (!focusField) return;
    const control = formRef.current?.elements.namedItem(focusField);
    if (control instanceof HTMLElement) control.focus();
  }, [state, focusField]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (pending) event.preventDefault();
  };

  const statusId = "admin-login-status";
  const status = failed
    ? t(`errors.${state.code}`)
    : pending
      ? t("pending")
      : "";

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      aria-label={t("form")}
      className="flex flex-col gap-7.5"
    >
      <Field label={t("email")}>
        {(props) => (
          <Input
            {...props}
            aria-invalid={failed || undefined}
            aria-describedby={failed ? statusId : undefined}
            name="email"
            type="email"
            autoComplete="username"
            required
            defaultValue={email}
            autoFocus={focusField === "email" || !failed}
          />
        )}
      </Field>
      <Field label={t("password")}>
        {(props) => (
          <Input
            {...props}
            aria-invalid={failed || undefined}
            aria-describedby={failed ? statusId : undefined}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus={focusField === "password"}
          />
        )}
      </Field>

      <div className="flex flex-col gap-4">
        <button
          type="submit"
          aria-disabled={pending || undefined}
          className={buttonStyles({
            className:
              "w-full aria-disabled:cursor-wait aria-disabled:opacity-50",
          })}
        >
          {t("submit")}
        </button>
        <p
          id={statusId}
          role="status"
          className={cx(
            "text-body empty:hidden",
            failed ? "text-purple-80" : "text-grey-70",
          )}
        >
          {status}
        </p>
      </div>
    </form>
  );
}
