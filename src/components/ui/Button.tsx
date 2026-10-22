import type { ComponentProps } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "outline" | "icon";
export type IconButtonSize = "md" | "lg";

// 수치: docs/design/nodes 의 "Button" (mobile → lg 노트북 → 3xl 데스크톱).
// Figma 테두리는 inside 라서, 테두리가 있는 변형은 CSS 패딩에서 1px 을 빼 높이를 맞춘다.
const base =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2.5 whitespace-nowrap transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-70 " +
  "disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0";

const variants: Record<Exclude<ButtonVariant, "icon">, string> = {
  // 보라 알약: 48/56/66 높이, 아이콘 20/24/30
  primary:
    "rounded-full bg-purple-55 px-7.5 py-3.5 text-button text-white hover:bg-purple-60 " +
    "lg:px-10 lg:py-4 3xl:px-12.5 3xl:py-4.5 [&_svg]:size-5 lg:[&_svg]:size-6 3xl:[&_svg]:size-7.5",
  // Dark/12 + 그라디언트 테두리: 49/49/59 높이, radius 8/8/10
  outline:
    "surface-raised rounded-lg px-4.75 py-3.25 text-button text-white " +
    "3xl:rounded-10 3xl:px-5.75 3xl:py-3.75 [&_svg]:size-4 3xl:[&_svg]:size-5",
};

const iconSizes: Record<IconButtonSize, string> = {
  // 슬라이더 화살표: 38/38/48, 아이콘 18/18/20
  md: "size-9.5 3xl:size-12 [&_svg]:size-4.5 3xl:[&_svg]:size-5",
  // 섹션 제목 옆 화살표: 48/48/62, 아이콘 28/28/34
  lg: "size-12 3xl:size-15.5 [&_svg]:size-7 3xl:[&_svg]:size-8.5",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: IconButtonSize;
  className?: string;
} = {}) {
  return cx(
    base,
    variant === "icon"
      ? cx("surface-raised rounded-full text-white", iconSizes[size])
      : variants[variant],
    className,
  );
}

type BaseProps = ComponentProps<"button"> & {
  /** icon 변형의 크기 */
  size?: IconButtonSize;
};

// icon 변형은 보이는 글자가 없으므로 aria-label 을 반드시 받는다
export type ButtonProps =
  | (BaseProps & { variant?: "primary" | "outline" })
  | (BaseProps & { variant: "icon"; "aria-label": string });

export function Button({
  variant = "primary",
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
