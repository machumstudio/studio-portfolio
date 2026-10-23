import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/Button";
import { Carousel } from "@/components/ui/Carousel";
import { PortfolioCard } from "@/components/ui/PortfolioCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Link } from "@/i18n/navigation";
import { useYearMonthFormat } from "@/i18n/use-year-month-format";

export type PortfolioPreviewItem = {
  slug: string;
  title: string;
  /** 촬영 연월 "YYYY-MM" */
  date: string;
  image: { src: string; alt: string };
};

type HomePortfolioProps = {
  items: PortfolioPreviewItem[];
};

// 수치: docs/design/nodes/home-*.json 의 Services 다음 "Container" (mobile → lg → 3xl).
// 제목 줄: 05칸 Carousel (화살표 아래 정렬) + 오른쪽 "모두 보기" outline 버튼.
// 카드: PortfolioCard. 한 화면 mobile 1 / md 2 / lg 3 장, 카드 간격 20 / 30 / 50 (406 / 499 폭).
// 링크는 /work/[slug] (작업 상세).
export function HomePortfolio({ items }: HomePortfolioProps) {
  const t = useTranslations("Portfolio");
  const formatYearMonth = useYearMonthFormat();

  return (
    <Carousel
      labelledBy="portfolio-title"
      className="page-x"
      trackClassName="lg:-mx-3.75 3xl:-mx-6.25"
      slideClassName="lg:px-3.75 3xl:px-6.25"
      previousLabel={t("previous")}
      nextLabel={t("next")}
      slideLabels={items.map((_, i) =>
        t("slide", { index: i + 1, total: items.length }),
      )}
      header={
        <SectionHeading
          id="portfolio-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          divider={false}
        />
      }
      actions={
        <Link
          href="/portfolio"
          className={buttonStyles({ variant: "outline" })}
        >
          {t("all")}
          <ArrowRight aria-hidden />
        </Link>
      }
    >
      {items.map((item) => (
        <PortfolioCard
          key={item.slug}
          href={`/work/${item.slug}`}
          title={item.title}
          date={item.date}
          dateLabel={formatYearMonth(item.date)}
          image={item.image}
          viewLabel={t("view")}
        />
      ))}
    </Carousel>
  );
}
