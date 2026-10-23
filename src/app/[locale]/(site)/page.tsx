import { use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { HomeAbout } from "@/components/sections/HomeAbout";
import { HomeHero, heroPhotoCount } from "@/components/sections/HomeHero";
import {
  HomePortfolio,
  type PortfolioPreviewItem,
} from "@/components/sections/HomePortfolio";
import { HomeServices } from "@/components/sections/HomeServices";
import { SiteFaq } from "@/components/sections/SiteFaq";
import type { LocalizedText } from "@/domain/works/localized-text";
import { getPublishedWorks } from "@/features/works/queries";
import {
  SiteTestimonials,
  type Testimonial,
} from "@/components/sections/SiteTestimonials";

// 사진은 16칸에서 Unsplash 로 교체할 때까지 임시 이미지. 꾸밈용 자리라 alt 는 비운다
const placeholder = { src: "/images/placeholder.svg", alt: "" };
const heroPhotos = Array.from({ length: heroPhotoCount }, () => placeholder);

// 서비스, FAQ, 후기는 당분간 메시지로 만든 고정값을 섹션 props 로 넘긴다.
// 서비스 순서: 시안 홈은 Events 가 첫 장이다 (Services 페이지 순서는 Portrait, Events, Commercial)
const services = {
  events: ["coverage", "moment", "story", "delivery"],
  portrait: ["style", "direction", "location", "retouch"],
  commercial: ["product", "space", "brand", "files"],
} as const;
const faqIds = [
  "specialty",
  "booking",
  "equipment",
  "location",
  "editing",
  "files",
  "prints",
  "delivery",
] as const;
const testimonialIds = [
  "emily",
  "john",
  "samantha",
  "olivia",
  "lucas",
  "sofia",
] as const;
// 가상 인물이라 계정이 없다. 푸터와 같이 각 서비스 첫 화면으로 둔다
const socials: Testimonial["socials"] = [
  { network: "instagram", href: "https://www.instagram.com/" },
  { network: "facebook", href: "https://www.facebook.com/" },
  { network: "x", href: "https://x.com/" },
];

// 시안 섹션 간격: 80 / 150 / 200 (노드 h 합과 프레임 높이 차이를 간격 수로 나눈 값, 시안 픽셀로 확인)
export default function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const service = useTranslations("Services.items");
  // 공개 작업 전체를 최신순으로. 링크(/work/[slug])는 09칸 전까지 404
  const works = use(getPublishedWorks());
  // locale 은 layout 에서 hasLocale 로 확인한 값
  const lang = locale as keyof LocalizedText;
  const faq = useTranslations("Faq.items");
  const testimonials = useTranslations("Testimonials.items");

  return (
    <main className="flex flex-col gap-20 pb-20 lg:gap-37.5 lg:pb-37.5 3xl:gap-50 3xl:pb-50">
      <HomeHero photos={heroPhotos} />
      {/* 연락처는 가짜 예시값 (가상 스튜디오) */}
      <HomeAbout
        photo={placeholder}
        email="hello@example.com"
        phone="+00 000000000"
      />
      <HomeServices
        items={Object.entries(services).map(([id, highlights]) => ({
          id,
          name: service(`${id}.name`),
          body: service(`${id}.body`),
          highlights: highlights.map((key) =>
            service(`${id}.highlights.${key}`),
          ),
          image: placeholder,
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
      <SiteFaq
        items={faqIds.map((id) => ({
          id,
          question: faq(`${id}.question`),
          answer: faq(`${id}.answer`),
        }))}
        defaultOpen={["specialty", "prints"]}
      />
      <SiteTestimonials
        total={323}
        items={testimonialIds.map((id) => ({
          id,
          name: testimonials(`${id}.name`),
          location: testimonials(`${id}.location`),
          rating: 5,
          quote: testimonials(`${id}.quote`),
          socials,
        }))}
      />
    </main>
  );
}
