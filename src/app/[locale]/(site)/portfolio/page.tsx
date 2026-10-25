import type { Metadata } from "next";
import { Suspense, use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { PortfolioFilter } from "@/components/sections/PortfolioFilter";
import { PortfolioGallery } from "@/components/sections/PortfolioGallery";
import { PortfolioHero } from "@/components/sections/PortfolioHero";
import type { LocalizedText } from "@/domain/works/localized-text";
import { getWorkGalleries } from "@/features/works/queries";
import { pagePhotos } from "../_sections/photos";
import { Faq, Testimonials } from "../_sections/site-sections";
import { staticPageMetadata } from "../_seo/page-metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/portfolio">): Promise<Metadata> {
  const { locale } = await params;
  return staticPageMetadata(locale, "/portfolio", "PortfolioPage.metadata");
}

// 필터 띠 + 갤러리. ?category= 는 요청마다 다른 값이라 Suspense 안에서 읽는다 (cacheComponents).
// 미리 만든 화면(fallback)은 전체 갤러리라, 필터 없는 주소는 바로 완성된 화면이 나간다
function Works({
  category,
  lang,
}: {
  category?: string;
  lang: keyof LocalizedText;
}) {
  const { categories, selected, galleries } = use(getWorkGalleries(category));
  return (
    <>
      <div className="mt-10 lg:mt-15 3xl:mt-20">
        <PortfolioFilter categories={categories} selected={selected} />
      </div>
      <div className="mt-20 lg:mt-25 3xl:mt-37.5">
        <PortfolioGallery
          galleries={galleries.map(({ category, works }) => ({
            category,
            items: works.map(({ slug, title, date, cover }) => ({
              slug,
              title: title[lang],
              date,
              image: { src: cover.src, alt: cover.alt[lang] },
            })),
          }))}
        />
      </div>
    </>
  );
}

// 시안 간격: 헤더-히어로 40/80/100, 히어로-필터 띠 40/60/80, 띠-갤러리 80/100/150,
// 이후 섹션 80/150/200 (노드 h 합과 프레임 높이 차이, 시안 픽셀의 테두리 위치로 확인)
export default function PortfolioPage({
  params,
  searchParams,
}: PageProps<"/[locale]/portfolio">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  // locale 은 layout 에서 hasLocale 로 확인한 값
  const lang = locale as keyof LocalizedText;
  const photo = useTranslations("Photos");

  return (
    <div className="flex flex-col pt-10 pb-20 lg:pt-20 lg:pb-37.5 3xl:pt-25 3xl:pb-50">
      <PortfolioHero
        image={{ src: pagePhotos.portfolioHero, alt: photo("portfolioHero") }}
      />
      <Suspense fallback={<Works lang={lang} />}>
        {searchParams.then(({ category }) => (
          <Works
            category={typeof category === "string" ? category : undefined}
            lang={lang}
          />
        ))}
      </Suspense>
      <div className="mt-20 flex flex-col gap-20 lg:mt-37.5 lg:gap-37.5 3xl:mt-50 3xl:gap-50">
        <Faq />
        <Testimonials />
      </div>
    </div>
  );
}
