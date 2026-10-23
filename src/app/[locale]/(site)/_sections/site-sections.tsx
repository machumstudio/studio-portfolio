import { useTranslations } from "next-intl";
import { SiteFaq } from "@/components/sections/SiteFaq";
import {
  SiteTestimonials,
  type Testimonial,
} from "@/components/sections/SiteTestimonials";

// 여러 페이지(Home, Portfolio, About, 이후 Services/Contact)가 같은 내용으로 쓰는 섹션 조립.
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

export function Faq() {
  const faq = useTranslations("Faq.items");
  return (
    <SiteFaq
      items={faqIds.map((id) => ({
        id,
        question: faq(`${id}.question`),
        answer: faq(`${id}.answer`),
      }))}
      defaultOpen={["specialty", "prints"]}
    />
  );
}

export function Testimonials() {
  const testimonials = useTranslations("Testimonials.items");
  return (
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
  );
}
