import { Sparkle } from "lucide-react";
import type { ComponentProps } from "react";
import { cx } from "./cx";

// 하이라이트 목록 한 줄: 반짝이 아이콘 + 대문자 한 줄 설명 (Services "Service Highlights", Home 서비스 슬라이더).
// <li> 로 렌더하므로 부모 <ul> 은 사용처에서 둔다.
// 수치는 Services 기준 (인스턴스가 가장 많다). 테두리 1px 은 inside 라 CSS 패딩에서 1px 을 뺀다.
// mobile pad 14/16 r10 gap4 아이콘 30 → lg pad 16/18 r10 gap6 → 3xl pad 18/20 r12 gap10 아이콘 40
export function HighlightItem({
  children,
  className,
  ...props
}: ComponentProps<"li">) {
  return (
    <li
      className={cx(
        "flex items-center gap-1 rounded-10 border border-dark-12 px-3.75 py-3.25 text-body text-grey-70 uppercase",
        "lg:gap-1.5 lg:px-4.25 lg:py-3.75 3xl:gap-2.5 3xl:rounded-xl 3xl:px-4.75 3xl:py-4.25",
        className,
      )}
      {...props}
    >
      {/* 시안의 반짝이(가는 별 + 보라 빛)에 가장 가까운 lucide 아이콘. 선만 쓴다 */}
      <Sparkle
        className="size-7.5 shrink-0 text-purple-80 3xl:size-10"
        strokeWidth={1.25}
      />
      <span>{children}</span>
    </li>
  );
}
