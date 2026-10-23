import { useTranslations } from "next-intl";
import { Carousel } from "@/components/ui/Carousel";
import { PortfolioCard } from "@/components/ui/PortfolioCard";
import { useYearMonthFormat } from "@/i18n/use-year-month-format";
import type { PortfolioPreviewItem } from "./HomePortfolio";

type PortfolioGalleryProps = {
  /** 카테고리 묶음. category 는 Works.categories.<id> 메시지 키 */
  galleries: { category: string; items: PortfolioPreviewItem[] }[];
};

// Portfolio 페이지의 카테고리별 갤러리 (Portraits, Events, Commercial). 묶음 하나가 Carousel 하나.
// 수치: docs/design/nodes/portfolio-*.json 의 두 번째 "Container" > "Sub Container".
// 묶음마다 위 테두리 Dark/12, pad 40/60/80 0. 제목 28/34/44 SemiBold Grey/50 대문자 + 화살표 알약(Carousel 기본값),
// 제목 줄-카드 간격 20/40/50, 카드 간격 20/40/50, 한 화면 mobile 1 / md 2 / lg 3 장.
// mobile 은 화살표가 카드 아래 50 (간격 20 + 30).
// 카드는 PortfolioCard gallery 변형. 공개 작업이 없는 묶음은 슬라이더 대신 안내 문구.
export function PortfolioGallery({ galleries }: PortfolioGalleryProps) {
  const t = useTranslations("PortfolioPage");
  const category = useTranslations("Works.categories");
  const card = useTranslations("Portfolio");
  const formatYearMonth = useYearMonthFormat();
  const block = "border-t border-dark-12 py-10 lg:py-15 3xl:py-20";

  return (
    <div id="works" className="flex flex-col page-x">
      {galleries.map(({ category: id, items }) => {
        const titleId = `gallery-${id}-title`;
        const title = (
          <h2 id={titleId} className="text-category text-grey-50 uppercase">
            {category(`${id}.title`)}
          </h2>
        );
        if (items.length === 0)
          return (
            <section
              key={id}
              aria-labelledby={titleId}
              className={`flex flex-col gap-5 lg:gap-10 3xl:gap-12.5 ${block}`}
            >
              {title}
              <p className="text-body text-grey-50">{t("empty")}</p>
            </section>
          );
        const name = category(`${id}.name`);
        return (
          <Carousel
            key={id}
            labelledBy={titleId}
            divider={false}
            alignControls="center"
            className={`gap-5 lg:gap-y-10 3xl:gap-y-12.5 ${block}`}
            controlsClassName="mt-7.5 lg:mt-0"
            trackClassName="lg:-mx-5 3xl:-mx-6.25"
            slideClassName="lg:px-5 3xl:px-6.25"
            previousLabel={t("previous", { category: name })}
            nextLabel={t("next", { category: name })}
            slideLabels={items.map((_, i) =>
              t("slide", { index: i + 1, total: items.length }),
            )}
            header={title}
          >
            {items.map((item) => (
              <PortfolioCard
                key={item.slug}
                variant="gallery"
                href={`/work/${item.slug}`}
                title={item.title}
                date={item.date}
                dateLabel={formatYearMonth(item.date)}
                image={item.image}
                viewLabel={card("view")}
              />
            ))}
          </Carousel>
        );
      })}
    </div>
  );
}
