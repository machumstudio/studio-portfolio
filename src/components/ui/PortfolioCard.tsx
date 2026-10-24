import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { buttonStyles } from "./Button";
import { cx } from "./cx";

type PortfolioCardProps = {
  /** 작업 상세 경로 (/work/[slug]) */
  href: string;
  title: string;
  /** <time dateTime> 값 (예: "2022-03") */
  date: string;
  /** 화면에 보이는 날짜 (예: "2022년 3월"). 언어별 형식은 사용처에서 정한다 */
  dateLabel: string;
  image: { src: string; alt: string };
  /** 링크 글자 (VIEW PROJECT). 카드가 여러 장이라 링크 이름 뒤에 제목을 숨겨 붙인다 */
  viewLabel: string;
  /** preview: 홈 미리보기, gallery: Portfolio 페이지 갤러리 (사진이 조금 낮고 노트북 글자가 작다) */
  variant?: "preview" | "gallery";
  className?: string;
};

const variants = {
  preview: {
    card: "gap-4 lg:gap-4.75",
    photo: "h-88.25 lg:h-107",
    row: "gap-3 lg:gap-4",
    text: "lg:gap-0.5",
    title: "text-h4 font-medium",
    date: "text-body leading-normal",
    link: "gap-1.5",
  },
  gallery: {
    card: "gap-3.5 3xl:gap-4.75",
    photo: "h-83.75 lg:h-102.25",
    row: "gap-3.5",
    text: "gap-0.5",
    title: "text-card",
    date: "text-caption",
    link: "gap-1",
  },
} as const;

// 작업 카드: 사진 + 제목/날짜 + "View Project" 링크 (홈 Portfolio 미리보기, 09칸 Portfolio 그리드).
// 수치: docs/design/nodes/home-*.json 의 Portfolio "Card" (mobile → lg → 3xl).
// 사진 높이 353/428/519, radius 16/16/20 → 간격 16/19/19 → 아래 줄(간격 12/16/20, 위 정렬).
// 제목 16/18/20 Medium Grey/80 → 간격 0/2/4 → 날짜 14/16/18 Regular Grey/50 (둘 다 행간 auto).
// 링크: Button link 변형 (아래 테두리 Dark/20, 글자 14/14/18 Medium Grey/95 대문자, 아이콘 20/20/24, 간격 6/6/10).
// gallery 변형 (docs/design/nodes/portfolio-*.json 의 갤러리 "Card"): 사진 335/409/519, 간격 14/14/19 → 아래 줄(간격 14/14/20),
//   제목 16/16/20 Medium → 간격 2/2/4 → 날짜 14/14/18 Regular, 링크 간격 4/4/10. 나머지는 같다.
export function PortfolioCard({
  href,
  title,
  date,
  dateLabel,
  image,
  viewLabel,
  variant = "preview",
  className,
}: PortfolioCardProps) {
  const v = variants[variant];
  return (
    <article className={cx("flex w-full flex-col", v.card, className)}>
      <div
        data-visual-mask
        className={cx(
          "relative overflow-hidden rounded-2xl bg-dark-15 3xl:h-129.75 3xl:rounded-20",
          v.photo,
        )}
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className={cx("flex items-start 3xl:gap-5", v.row)}>
        <div className={cx("flex min-w-0 flex-1 flex-col 3xl:gap-1", v.text)}>
          <h3 className={cx("text-grey-80", v.title)}>{title}</h3>
          <time dateTime={date} className={cx("text-grey-50", v.date)}>
            {dateLabel}
          </time>
        </div>
        <Link
          href={href}
          className={buttonStyles({ variant: "link", className: v.link })}
        >
          {viewLabel}
          <span className="sr-only">: {title}</span>
          <ArrowUpRight aria-hidden strokeWidth={1.5} />
        </Link>
      </div>
    </article>
  );
}
