import { use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { SiteFaq } from "@/components/sections/SiteFaq";
import {
  SiteTestimonials,
  type Testimonial,
} from "@/components/sections/SiteTestimonials";

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
export default function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const faq = useTranslations("Faq.items");
  const testimonials = useTranslations("Testimonials.items");

  return (
    <main className="flex flex-col gap-20 pb-20 lg:gap-37.5 lg:pb-37.5 3xl:gap-50 3xl:pb-50">
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
