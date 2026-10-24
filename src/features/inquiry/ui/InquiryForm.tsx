"use client";

import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useActionState,
  useEffect,
  useRef,
  type ComponentProps,
  type FormEvent,
} from "react";
import { inquiryLimits } from "@/application/inquiry/limits";
import { buttonStyles } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { Field, Input, Textarea } from "@/components/ui/Field";
import {
  firstErrorField,
  initialInquiryFormState,
  type InquiryFormState,
} from "../form-state";
import { honeypotFieldName, type InquiryFieldName } from "../schema";

type InquiryFormAction = (
  state: InquiryFormState,
  formData: FormData,
) => Promise<InquiryFormState>;

type InquiryFormProps = {
  /** 페이지가 서버 액션(submitInquiryAction)을 넘긴다. 스토리와 테스트는 가짜를 넘긴다 */
  action: InquiryFormAction;
  /** 스토리에서 오류/성공 화면을 바로 보여 줄 때 */
  initialState?: InquiryFormState;
};

// 칸별 입력 속성. maxLength 는 domain 한도 (application/inquiry/limits). 검증은 서버(domain)만 한다
const controls: Record<
  InquiryFieldName,
  ComponentProps<"input"> & ComponentProps<"textarea">
> = {
  firstName: {
    autoComplete: "given-name",
    maxLength: inquiryLimits.name,
    required: true,
  },
  lastName: {
    autoComplete: "family-name",
    maxLength: inquiryLimits.name,
    required: true,
  },
  email: {
    type: "email",
    autoComplete: "email",
    maxLength: inquiryLimits.email,
    required: true,
  },
  phone: { type: "tel", autoComplete: "tel", maxLength: inquiryLimits.phone },
  message: { maxLength: inquiryLimits.message, required: true },
};

// 문의 폼. JS 가 없으면 일반 POST 로 서버 액션이 불리고 결과 화면을 서버가 그린다 (docs/adr/0009).
// - 틀린 칸은 서버 결과로 한 번에 모두 표시 (Field 가 aria-invalid + aria-describedby 를 잇는다)
// - 제출 후 첫 오류 칸으로 포커스: JS 가 있으면 effect, 없으면 autoFocus 속성 (서버 HTML 에 들어간다)
// - 성공/실패/오류 개수는 role=status 로 알린다. 오류일 때는 서버가 돌려준 입력값을 defaultValue 로 다시 채운다
// - 제출 중에는 버튼을 aria-disabled 로 막고 submit 을 무시한다 (disabled 는 포커스를 잃게 해서 쓰지 않는다)
// - 브라우저 기본 검증 말풍선은 끈다(noValidate). required 는 보조기기 안내용
// 수치: docs/design/nodes/contact-*.json 의 "Contact Form".
//   칸 간격 30/40/50, lg 부터 2열(이름/성, 이메일/연락처), 메시지와 제출은 한 줄 전체.
//   메시지 칸은 시안처럼 한 줄 높이(45/45/58)에서 시작해 내용만큼 늘어난다 (field-sizing).
//   제출: 글자(text-send) + 보라 알약(48/56/66), 간격 6/6/10, 아래 pad 6/6/10 + 테두리 Dark/12.
export function InquiryForm({
  action,
  initialState = initialInquiryFormState,
}: InquiryFormProps) {
  const t = useTranslations("InquiryForm");
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const errors = state.status === "invalid" ? state.errors : {};
  const values = "values" in state ? state.values : undefined;
  const firstError = firstErrorField(errors);
  const errorCount = Object.keys(errors).length;

  // 새 결과가 올 때마다 (같은 칸이 또 틀려도) 첫 오류 칸으로
  useEffect(() => {
    if (!firstError) return;
    const control = formRef.current?.elements.namedItem(firstError);
    if (control instanceof HTMLElement) control.focus();
  }, [state, firstError]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (pending) event.preventDefault();
  };

  const field = (name: InquiryFieldName, className?: string) => {
    const error = errors[name];
    const Control = name === "message" ? Textarea : Input;
    return (
      <Field
        className={className}
        label={
          name === "phone" ? (
            <>
              {t("fields.phone.label")}{" "}
              <span className="text-grey-50">
                ({t("fields.phone.optional")})
              </span>
            </>
          ) : (
            t(`fields.${name}.label`)
          )
        }
        error={
          error &&
          t(`errors.${name}.${error.code}`, {
            max: "max" in error ? error.max : 0,
          })
        }
      >
        {(props) => (
          <Control
            {...props}
            {...controls[name]}
            name={name}
            placeholder={t(`fields.${name}.placeholder`)}
            defaultValue={values?.[name]}
            autoFocus={name === firstError}
            {...(name === "message" && {
              rows: 1,
              className:
                "field-sizing-content min-h-11.25 max-h-80 resize-none 3xl:min-h-14.5",
            })}
          />
        )}
      </Field>
    );
  };

  const status =
    state.status === "success"
      ? t("status.success")
      : state.status === "error"
        ? t("status.error")
        : state.status === "invalid"
          ? t("status.invalid", { count: errorCount })
          : pending
            ? t("pending")
            : "";

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      aria-label={t("label")}
      className="relative grid gap-7.5 lg:grid-cols-2 lg:gap-10 3xl:gap-12.5"
    >
      {field("firstName")}
      {field("lastName")}
      {field("email")}
      {field("phone")}
      {field("message", "lg:col-span-2")}

      {/* 허니팟: 사람에게는 보이지 않고 Tab 으로도 닿지 않는다. 자동 제출기가 채우면 서버가 버린다 */}
      <div aria-hidden className="sr-only">
        <label htmlFor="inquiry-website">{t("honeypot")}</label>
        <input
          id="inquiry-website"
          name={honeypotFieldName}
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div className="flex flex-col items-start lg:col-span-2">
        <button
          type="submit"
          aria-disabled={pending || undefined}
          className="group inline-flex cursor-pointer items-center gap-1.5 border-b border-dark-12 pb-1.5 text-send text-white uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-70 aria-disabled:cursor-wait aria-disabled:opacity-50 3xl:gap-2.5 3xl:pb-2.5"
        >
          {t("submit")}
          <span
            aria-hidden
            className={buttonStyles({ className: "group-hover:bg-purple-60" })}
          >
            <ArrowUpRight />
          </span>
        </button>
        <p
          role="status"
          className={cx(
            "mt-4 text-body empty:mt-0",
            state.status === "invalid" || state.status === "error"
              ? "text-purple-80"
              : "text-grey-90",
          )}
        >
          {status}
        </p>
      </div>
    </form>
  );
}
