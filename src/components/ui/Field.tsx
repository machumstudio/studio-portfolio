import { ChevronDown } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";
import { cx } from "./cx";

export type FieldControlProps = {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

type FieldProps = {
  label: ReactNode;
  /** 라벨 아래 보조 설명 */
  hint?: ReactNode;
  /** 있으면 aria-invalid 와 함께 읽힌다 */
  error?: ReactNode;
  className?: string;
  /** 컨트롤에 id / aria 속성을 넘긴다: {(props) => <Input {...props} />} */
  children: (control: FieldControlProps) => ReactNode;
};

// 수치: docs/design/nodes/contact-*.json 의 "Sub Container" > Heading + "Input Feild".
// 라벨-입력 간격 6/6/10, 입력 위아래 패딩 10/10/14 (아래 테두리 1px 은 inside 라 1px 뺌).
export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cx("flex flex-col gap-1.5 3xl:gap-2.5", className)}>
      <label htmlFor={id} className="text-label text-grey-90">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-body text-grey-50">
          {hint}
        </p>
      )}
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {/* 시안에 오류 색이 없어 강조색(Purple)을 쓴다. 문의 폼(13칸)에서 다시 본다 */}
      {error && (
        <p id={errorId} className="text-body text-purple-80">
          {error}
        </p>
      )}
    </div>
  );
}

// 한 줄 컨트롤(Input, Select)의 시안 높이 45/45/58. select 는 행간을 높이에 쓰지 않아 높이를 직접 준다
const singleLine = "h-11.25 3xl:h-14.5";

const control =
  "w-full rounded-none border-b border-dark-20 bg-transparent pt-2.5 pb-2.25 text-field text-white " +
  "placeholder:text-grey-50 placeholder:uppercase 3xl:pt-3.5 3xl:pb-3.25 " +
  "outline-none focus-visible:border-purple-70 focus-visible:focus-underline aria-invalid:border-purple-80 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export function Input({
  className,
  type = "text",
  ...props
}: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cx(control, singleLine, className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  rows = 4,
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      rows={rows}
      className={cx(control, "resize-y", className)}
      {...props}
    />
  );
}

type SelectProps = ComponentProps<"select"> & {
  /** 아무것도 고르지 않았을 때 보이는 첫 항목 (선택 불가) */
  placeholder?: string;
};

export function Select({
  className,
  placeholder,
  children,
  defaultValue,
  ...props
}: SelectProps) {
  // 값을 따로 주지 않았으면 placeholder 항목이 선택된 상태로 시작한다
  const initial =
    defaultValue ?? (placeholder && props.value === undefined ? "" : undefined);
  return (
    <div className="relative">
      <select
        className={cx(
          control,
          singleLine,
          "cursor-pointer appearance-none pr-8 [&_option]:bg-dark-08 [&_option]:text-white [&_option]:normal-case",
          // 빈 값(placeholder)이 선택돼 있으면 Input 의 placeholder 와 같은 모양
          "has-[option[value='']:checked]:text-grey-50 has-[option[value='']:checked]:uppercase",
          className,
        )}
        defaultValue={initial}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-0 size-5 -translate-y-1/2 text-grey-50 3xl:size-6" />
    </div>
  );
}
