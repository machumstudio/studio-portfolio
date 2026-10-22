import { Star } from "lucide-react";
import { buttonStyles } from "./Button";
import { cx } from "./cx";

export type TestimonialSocial = {
  /** 링크 이름 ("Emily Johnson의 Instagram (새 탭에서 열림)") */
  label: string;
  href: string;
  /** 24x24 viewBox 의 path (simple-icons) */
  iconPath: string;
};

type TestimonialCardProps = {
  name: string;
  location: string;
  /** 0~5 */
  rating: number;
  /** 별점 읽기 이름 ("5점 만점에 5점") */
  ratingLabel: string;
  quote: string;
  socials: TestimonialSocial[];
  className?: string;
};

// 수치: docs/design/nodes/home-*.json 의 Testimonials "Card" (mobile → lg → 3xl).
// Dark/06 + 테두리 Dark/12, radius 10/10/12, pad 24/30/40 (테두리 inside 라 1px 뺌), 줄 간격 20/24/30.
// 이름(16/18/20 Medium Grey/90) + 지역(14/16/18 Grey/40) | 소셜 알약(Dark/03 + 테두리 Dark/12, pad 8/8/10, 간격 8/8/10).
// 별 20/20/24 간격 4/4/5, 본문 16/18/20 Medium Grey/90.
// 배경 "Abstract Design"(45도 돌린 둥근 사각형 2개, 그라디언트)은 노드에 위치/색 정지점이 없어 시안 픽셀을 보고 맞췄다.
export function TestimonialCard({
  name,
  location,
  rating,
  ratingLabel,
  quote,
  socials,
  className,
}: TestimonialCardProps) {
  return (
    <article
      className={cx(
        "relative flex w-full flex-col gap-5 overflow-hidden rounded-10 border border-dark-12 bg-dark-06 p-5.75 lg:gap-6 lg:p-7.25 3xl:gap-7.5 3xl:rounded-xl 3xl:p-9.75",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-1/2 left-2/3 size-62 rotate-45 rounded-3xl bg-linear-to-b from-dark-08 to-dark-06 lg:size-75.75 3xl:size-93.25" />
        <div className="absolute top-1/3 -left-1/4 size-81.5 rotate-45 rounded-3xl bg-linear-to-b from-dark-08 to-dark-06 lg:size-99.5 3xl:size-122.5" />
      </div>
      <div className="relative flex items-center justify-between gap-2.5 lg:gap-6.5">
        <div className="min-w-0">
          <h3 className="text-lead text-grey-90">{name}</h3>
          <p className="text-body text-grey-40">{location}</p>
        </div>
        <ul className="flex shrink-0 gap-2 rounded-full border border-dark-12 bg-dark-03 p-1.75 3xl:gap-2.5 3xl:p-2.25">
          {socials.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className={buttonStyles({ variant: "icon", size: "md" })}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d={social.iconPath} />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <p
        role="img"
        aria-label={ratingLabel}
        className="relative flex gap-1 3xl:gap-1.25"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            strokeWidth={1.5}
            strokeLinejoin="round"
            className={cx(
              "size-5 3xl:size-6",
              i < rating ? "fill-star text-star" : "fill-dark-20 text-dark-20",
            )}
          />
        ))}
      </p>
      <blockquote className="relative text-lead break-keep text-grey-90">
        <p>{quote}</p>
      </blockquote>
    </article>
  );
}
