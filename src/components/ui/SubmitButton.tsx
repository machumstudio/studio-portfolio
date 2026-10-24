"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonStyles, type ButtonVariant } from "./Button";
import { cx } from "./cx";

type SubmitButtonProps = Omit<ComponentProps<"button">, "type"> & {
  variant?: Exclude<ButtonVariant, "icon">;
  /** 보내는 동안 보이는 글자 (예: "바꾸는 중…") */
  pendingLabel: ReactNode;
};

// 서버 액션 폼의 제출 버튼. 보내는 동안 글자를 바꾸고 다시 눌러도 보내지 않는다.
// disabled 대신 aria-disabled: 포커스가 버튼에 남아 키보드/화면 읽기 사용자가 위치를 잃지 않는다.
// JS 가 없으면 일반 제출 버튼이다
export function SubmitButton({
  variant = "primary",
  pendingLabel,
  children,
  className,
  onClick,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      {...props}
      type="submit"
      aria-disabled={pending || undefined}
      onClick={(event) => {
        if (pending) event.preventDefault();
        else onClick?.(event);
      }}
      className={buttonStyles({
        variant,
        className: cx(
          "aria-disabled:cursor-wait aria-disabled:opacity-50",
          className,
        ),
      })}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
