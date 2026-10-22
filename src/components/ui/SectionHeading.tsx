import type { ReactNode } from "react";
import { cx } from "./cx";

type SectionHeadingProps = {
  /** 제목 위 라벨 (예: PORTFOLIO) */
  eyebrow: ReactNode;
  title: ReactNode;
  /** 오른쪽(모바일은 아래) 버튼 영역 */
  actions?: ReactNode;
  /** 아래 구분선. Home 섹션들은 있고 FAQ, Testimonials, About 페이지는 없다 */
  divider?: boolean;
  /** 제목과 버튼의 세로 정렬. 시안은 대부분 center, Portfolio 만 end */
  alignActions?: "center" | "end";
  as?: "h1" | "h2" | "h3";
  /** 제목 요소의 id. <section aria-labelledby> 에 쓴다 */
  id?: string;
  className?: string;
};

// 수치: docs/design/nodes 의 섹션 제목 "Sub Container" (mobile → lg → 3xl).
// 라벨/제목 간격 0/2/4, 제목-버튼 간격 20, 구분선 아래 여백 20/40/50 (테두리 1px 은 inside 라 1px 뺌),
// 버튼 사이 간격 20/20/30.
export function SectionHeading({
  eyebrow,
  title,
  actions,
  divider = true,
  alignActions = "center",
  as: Heading = "h2",
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cx(
        "flex flex-col items-start gap-5 lg:flex-row lg:justify-between",
        alignActions === "end" ? "lg:items-end" : "lg:items-center",
        divider && "border-b border-dark-12 pb-4.75 lg:pb-9.75 3xl:pb-12.25",
        className,
      )}
    >
      <hgroup className="flex min-w-0 flex-col lg:gap-0.5 3xl:gap-1">
        <p className="text-eyebrow text-grey-50 uppercase">{eyebrow}</p>
        <Heading id={id} className="text-h1 text-white uppercase">
          {title}
        </Heading>
      </hgroup>
      {actions && (
        <div className="flex shrink-0 items-center gap-5 3xl:gap-7.5">
          {actions}
        </div>
      )}
    </div>
  );
}
