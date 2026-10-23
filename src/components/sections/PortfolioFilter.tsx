import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type PortfolioFilterProps = {
  /** 카테고리 id (갤러리 순서). 이름은 Works.categories.<id>.name */
  categories: readonly string[];
  /** 지금 고른 카테고리. null 이면 전체 */
  selected: string | null;
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-70";

// 카테고리 필터. 시안에 없는 UI 라 Portfolio 히어로 아래 "Brands I have worked with" 띠 자리
// (portfolio-*.json: 라벨 14/14/16 Medium Grey/50 (데스크톱 16 은 글자 토큰에 없어 text-base) → 간격 14/14/18 → Dark/06 띠, 위아래 Dark/12 테두리, 안쪽 높이 34/40/50)
// 에 같은 틀로 둔다. 로고 대신 알약 링크: 테두리 Dark/20 + Grey/70 글자, 고른 것은 Purple/55 (버튼 primary 색).
// 링크는 ?category= 주소라 공유/뒤로가기가 되고, 같은 페이지 안 이동이라 스크롤은 그대로 둔다.
// mobile 은 띠 안에서 가로로 스크롤한다 (영문 이름이 390 폭을 넘는다)
export function PortfolioFilter({
  categories,
  selected,
}: PortfolioFilterProps) {
  const t = useTranslations("PortfolioPage.filter");
  const name = useTranslations("Works.categories");
  const items = [
    { key: "all", href: "/portfolio", label: t("all"), current: !selected },
    ...categories.map((id) => ({
      key: id,
      href: `/portfolio?category=${id}`,
      label: name(`${id}.name`),
      current: id === selected,
    })),
  ];

  return (
    <nav
      aria-labelledby="portfolio-filter-title"
      className="flex flex-col items-center gap-3.5 3xl:gap-4.5"
    >
      <p
        id="portfolio-filter-title"
        className="text-caption font-medium text-grey-50 uppercase 3xl:text-base 3xl:leading-normal"
      >
        {t("label")}
      </p>
      <div className="scrollbar-none w-full overflow-x-auto border-y border-dark-12 bg-dark-06 py-3.25 lg:py-5.75 3xl:py-7.25">
        <ul className="mx-auto flex w-max gap-2 px-4 lg:gap-3 3xl:gap-4">
          {items.map(({ key, href, label, current }) => (
            <li key={key}>
              <Link
                href={href}
                scroll={false}
                aria-current={current ? "page" : undefined}
                className={`flex h-8.5 items-center rounded-full border border-dark-20 px-4 text-button whitespace-nowrap text-grey-70 transition-colors hover:text-white aria-[current=page]:border-purple-55 aria-[current=page]:bg-purple-55 aria-[current=page]:text-white lg:h-10 lg:px-5 3xl:h-12.5 3xl:px-6.25 ${focusRing}`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
