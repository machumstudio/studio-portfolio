import { useFormatter, useTranslations } from "next-intl";
import { siFacebook, siInstagram, siX } from "simple-icons";
import { Carousel } from "@/components/ui/Carousel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TestimonialCard } from "@/components/ui/TestimonialCard";

const icons = { instagram: siInstagram, facebook: siFacebook, x: siX };

export type Testimonial = {
  id: string;
  name: string;
  location: string;
  rating: number;
  quote: string;
  socials: { network: keyof typeof icons; href: string }[];
};

type SiteTestimonialsProps = {
  /** 전체 리뷰 수 (시안 323) */
  total: number;
  items: Testimonial[];
};

// Testimonials: Home, About, Portfolio, Contact 공통. 푸터 "후기" 링크(/#testimonials)의 목적지.
// 제목 아래 전체 리뷰 수(라벨 14/16/18 Grey/40 → 간격 2/2/6 → 숫자 20/24/28 Medium Grey/80),
// 제목-리뷰 수 간격 20/14/20. 슬라이더 수치는 Carousel, 카드는 TestimonialCard 주석 참고.
export function SiteTestimonials({ total, items }: SiteTestimonialsProps) {
  const t = useTranslations("Testimonials");
  const social = useTranslations("Layout.footer");
  const format = useFormatter();

  return (
    <Carousel
      id="testimonials"
      labelledBy="testimonials-title"
      className="page-x"
      previousLabel={t("previous")}
      nextLabel={t("next")}
      slideLabels={items.map((_, i) =>
        t("slide", { index: i + 1, total: items.length }),
      )}
      header={
        <div className="flex flex-col gap-5 lg:gap-3.5 3xl:gap-5">
          <SectionHeading
            id="testimonials-title"
            eyebrow={t("eyebrow")}
            title={t("title")}
            divider={false}
          />
          <p className="flex flex-col gap-0.5 3xl:gap-1.5">
            <span className="text-body text-grey-50">{t("total")}</span>
            <span className="text-h3 text-grey-80">{format.number(total)}</span>
          </p>
        </div>
      }
    >
      {items.map((item) => (
        <TestimonialCard
          key={item.id}
          name={item.name}
          location={item.location}
          rating={item.rating}
          ratingLabel={t("rating", { rating: item.rating })}
          quote={item.quote}
          socials={item.socials.map(({ network, href }) => ({
            href,
            iconPath: icons[network].path,
            label: `${t("social", { name: item.name, network: social(`social.${network}`) })} (${social("newTab")})`,
          }))}
        />
      ))}
    </Carousel>
  );
}
