import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/SectionHeading";

export type TimelineItem = {
  year: number;
  body: string;
};

type AboutTimelineProps = {
  /** 오래된 해부터 */
  items: TimelineItem[];
};

// About 페이지 연도별 타임라인. 수치: docs/design/nodes/about-*.json 둘째 "Container" (mobile → lg → 3xl).
// 제목: SectionHeading(구분선, 아래 여백 20/40/50). 제목-목록 간격 40/60/80.
// 목록: mobile 1열 간격 20, lg 2열 간격 20/30 (행 높이는 그 줄의 긴 카드에 맞춘다).
// 카드: Dark/06 + 테두리 Dark/12, radius 10/10/12, pad 24/40/50 (테두리 inside 라 1px 뺌), 간격 10/14/20.
//   해 24/34/44 SemiBold, 본문 14/16/18 Regular 150%, 둘 다 Grey/50.
//   배경 "Abstract Design"(45도 돌린 둥근 사각형 364·388 / 385·410 / 459·490, 그라디언트)은 노드에 위치/색 정지점이 없어
//   시안 픽셀을 보고 맞췄다 (TestimonialCard 와 같은 방식).
// 순서가 있는 연표라 <ol>. 태블릿(시안 없음)도 2열.
export function AboutTimeline({ items }: AboutTimelineProps) {
  const t = useTranslations("AboutPage.timeline");

  return (
    <section
      aria-labelledby="about-timeline-title"
      className="flex flex-col gap-10 page-x lg:gap-15 3xl:gap-20"
    >
      <SectionHeading
        id="about-timeline-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
      />
      <ol className="grid gap-5 md:grid-cols-2 3xl:gap-7.5">
        {items.map(({ year, body }) => (
          <li
            key={year}
            className="relative flex flex-col gap-2.5 overflow-hidden rounded-10 border border-dark-12 bg-dark-06 p-5.75 lg:gap-3.5 lg:p-9.75 3xl:gap-5 3xl:rounded-xl 3xl:p-12.25"
          >
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -top-3/4 left-3/5 size-97 rotate-45 rounded-3xl bg-linear-to-b from-dark-08 to-dark-06 lg:size-102.5 3xl:size-122.5" />
              <div className="absolute top-3/4 -left-1/4 size-91 rotate-45 rounded-3xl bg-linear-to-b from-dark-08 to-dark-06 lg:size-96.25 3xl:size-114.75" />
            </div>
            <h3 className="relative text-h2 text-grey-50 uppercase">
              <time dateTime={String(year)}>{t("year", { year })}</time>
            </h3>
            <p className="relative text-body text-grey-50">{body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
