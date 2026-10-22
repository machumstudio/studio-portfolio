import { use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { SiteCta } from "@/components/sections/SiteCta";
import { SiteFaq } from "@/components/sections/SiteFaq";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";
import {
  SiteTestimonials,
  type Testimonial,
} from "@/components/sections/SiteTestimonials";
import { getCopyrightYear } from "@/lib/copyright-year";
import { TokenSheet } from "./token-sheet";

// FAQ 와 후기는 당분간 메시지로 만든 고정값을 섹션 props 로 넘긴다
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
// 본문 앞부분은 아직 임시 토큰 확인 페이지. 06~07칸에서 Hero, About, Services, Portfolio 로 교체한다.
export default function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const faq = useTranslations("Faq.items");
  const testimonials = useTranslations("Testimonials.items");

  return (
    <>
      <SiteHeader />
      <main className="flex flex-col gap-20 pb-20 lg:gap-37.5 lg:pb-37.5 3xl:gap-50 3xl:pb-50">
        <TokenSheet />
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
      <SiteFooter cta={<SiteCta />} year={use(getCopyrightYear())} />
    </>
  );
}
