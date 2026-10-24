import type { Metadata } from "next";
import { use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { HomeAbout } from "@/components/sections/HomeAbout";
import { HomeHero } from "@/components/sections/HomeHero";
import {
  HomePortfolio,
  type PortfolioPreviewItem,
} from "@/components/sections/HomePortfolio";
import { HomeServices } from "@/components/sections/HomeServices";
import type { LocalizedText } from "@/domain/works/localized-text";
import { getPublishedWorks } from "@/features/works/queries";
import { heroCollage, pagePhotos, servicePhoto } from "./_sections/photos";
import { Faq, Testimonials } from "./_sections/site-sections";
import { studioContact } from "./_sections/studio-contact";
import { staticPageMetadata } from "./_seo/page-metadata";

// 서비스는 당분간 메시지로 만든 고정값을 섹션 props 로 넘긴다.
// 서비스 순서: 시안 홈은 Events 가 첫 장이다 (Services 페이지 순서는 Portrait, Events, Commercial)
const services = {
  events: ["coverage", "moment", "story", "delivery"],
  portrait: ["style", "direction", "location", "retouch"],
  commercial: ["product", "space", "brand", "files"],
} as const;

const previewLimit = 6;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  return staticPageMetadata(locale, "/", "Metadata");
}

// 시안 섹션 간격: 80 / 150 / 200 (노드 h 합과 프레임 높이 차이를 간격 수로 나눈 값, 시안 픽셀로 확인)
export default function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const service = useTranslations("Services.items");
  const photo = useTranslations("Photos");
  // 공개 작업 중 최신 6개. 나머지는 "모든 작업 보기"(/portfolio)에서
  const works = use(getPublishedWorks({ limit: previewLimit }));
  // locale 은 layout 에서 hasLocale 로 확인한 값
  const lang = locale as keyof LocalizedText;

  return (
    <main className="flex flex-col gap-20 pb-20 lg:gap-37.5 lg:pb-37.5 3xl:gap-50 3xl:pb-50">
      <HomeHero photos={heroCollage} />
      <HomeAbout
        photo={{ src: pagePhotos.homeAbout, alt: photo("homeAbout") }}
        email={studioContact.email}
        phone={studioContact.phone}
      />
      <HomeServices
        items={Object.entries(services).map(([id, highlights]) => ({
          id,
          name: service(`${id}.name`),
          body: service(`${id}.body`),
          highlights: highlights.map((key) =>
            service(`${id}.highlights.${key}`),
          ),
          // Services 페이지 슬라이더의 첫 장
          image: {
            src: servicePhoto(id, "1"),
            alt: photo(`services.${id}.1`),
          },
        }))}
      />
      <HomePortfolio
        items={works.map(
          ({ slug, title, date, cover }): PortfolioPreviewItem => ({
            slug,
            title: title[lang],
            date,
            image: { src: cover.src, alt: cover.alt[lang] },
          }),
        )}
      />
      <Faq />
      <Testimonials />
    </main>
  );
}
