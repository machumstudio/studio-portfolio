import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
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
  className?: string;
};

// 작업 카드: 사진 + 제목/날짜 + "View Project" 링크 (홈 Portfolio 미리보기, 09칸 Portfolio 그리드).
// 수치: docs/design/nodes/home-*.json 의 Portfolio "Card" (mobile → lg → 3xl).
// 사진 높이 353/428/519, radius 16/16/20 → 간격 16/19/19 → 아래 줄(간격 12/16/20, 위 정렬).
// 제목 16/18/20 Medium Grey/80 → 간격 0/2/4 → 날짜 14/16/18 Regular Grey/50 (둘 다 행간 auto).
// 링크: 아래 테두리 Dark/20, pad 4 0 / 4 0 / 6 0 (테두리 inside 라 아래 1px 뺌), 글자 14/14/18 Medium Grey/95 대문자,
//   아이콘 20/20/24 흰색, 간격 6/6/10.
export function PortfolioCard({
  href,
  title,
  date,
  dateLabel,
  image,
  viewLabel,
  className,
}: PortfolioCardProps) {
  return (
    <article
      className={cx("flex w-full flex-col gap-4 lg:gap-4.75", className)}
    >
      <div
        data-visual-mask
        className="relative h-88.25 overflow-hidden rounded-2xl bg-dark-15 lg:h-107 3xl:h-129.75 3xl:rounded-20"
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex items-start gap-3 lg:gap-4 3xl:gap-5">
        <div className="flex min-w-0 flex-1 flex-col lg:gap-0.5 3xl:gap-1">
          <h3 className="text-h4 font-medium text-grey-80">{title}</h3>
          <time
            dateTime={date}
            className="text-body leading-normal text-grey-50"
          >
            {dateLabel}
          </time>
        </div>
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1.5 border-b border-dark-20 pt-1 pb-0.75 text-caption font-medium text-grey-95 uppercase transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-70 3xl:gap-2.5 3xl:pt-1.5 3xl:pb-1.25"
        >
          {viewLabel}
          <span className="sr-only">: {title}</span>
          <ArrowUpRight
            aria-hidden
            className="size-5 text-white 3xl:size-6"
            strokeWidth={1.5}
          />
        </Link>
      </div>
    </article>
  );
}
