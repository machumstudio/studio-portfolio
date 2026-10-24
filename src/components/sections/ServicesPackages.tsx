import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/Button";
import { PhotoSlider } from "@/components/ui/PhotoSlider";
import { PriceCard } from "@/components/ui/PriceCard";
import { Link } from "@/i18n/navigation";
import type { Price } from "@/i18n/use-price-format";

export type ServicePackage = {
  id: string;
  name: string;
  /** 없으면 맞춤 견적 */
  price?: Price;
  features: string[];
};

export type ServiceOffering = {
  /** 앵커(/services#id)와 Portfolio 필터(?category=id) 에 같이 쓴다 */
  id: string;
  title: string;
  body: string;
  images: { src: string; alt: string }[];
  packages: ServicePackage[];
};

type ServicesPackagesProps = {
  services: ServiceOffering[];
};

// Services 페이지의 서비스별 소개 + 가격 패키지. 서비스 하나가 <section id> 하나 (홈 서비스 슬라이더의 /services#id 목적지).
// 수치: docs/design/nodes/services-*.json 의 둘째 "Container" > "Sub Container" (mobile → lg → 3xl).
// 서비스: 위 테두리 Dark/12, 위 pad 30/60/80. 아래로 소개 줄 → PriceCard 들 (패키지마다 위 테두리).
// 소개 줄: 아래 pad 30/60/80. mobile 세로(간격 30) / lg 부터 글 | 사진 가로(간격 40/50, 세로 가운데).
//   글 칸 폭 522/652 (줄 폭의 51/125), 제목 28/34/44 SemiBold Grey/50 대문자 → 소개글 14/16/18 → "작업 보기" 링크,
//   간격 24/40/50. 링크는 Button link 변형, Portfolio 의 같은 분야 필터로 간다.
//   사진은 PhotoSlider: 358x229 / 높이 311 / 360, radius 12/12/20 (노드는 BOOLEAN, 시안 픽셀).
//   태블릿(시안 없음)은 mobile 배치에 사진 비율만 유지.
export function ServicesPackages({ services }: ServicesPackagesProps) {
  const t = useTranslations("ServicesPage");

  return (
    <div id="packages" className="flex flex-col page-x">
      {services.map(({ id, title, body, images, packages }) => (
        <section
          key={id}
          id={id}
          aria-labelledby={`service-${id}-title`}
          className="flex flex-col border-t border-dark-12 pt-7.5 lg:pt-15 3xl:pt-20"
        >
          <div className="flex flex-col gap-7.5 pb-7.5 lg:flex-row lg:items-center lg:gap-10 lg:pb-15 3xl:gap-12.5 3xl:pb-20">
            <div className="flex flex-col items-start gap-6 lg:w-51/125 lg:shrink-0 lg:gap-10 3xl:gap-12.5">
              <h2
                id={`service-${id}-title`}
                className="text-category text-grey-50 uppercase"
              >
                {title}
              </h2>
              <p className="text-body break-keep text-grey-50">{body}</p>
              <Link
                href={`/portfolio?category=${id}`}
                className={buttonStyles({ variant: "link" })}
              >
                {t("view")}
                <span className="sr-only">: {title}</span>
                <ArrowUpRight aria-hidden strokeWidth={1.5} />
              </Link>
            </div>
            <PhotoSlider
              className="lg:flex-1"
              images={images}
              label={t("photos", { service: title })}
              previousLabel={t("previous", { service: title })}
              nextLabel={t("next", { service: title })}
              slideLabels={images.map((_, i) =>
                t("slide", { index: i + 1, total: images.length }),
              )}
              sizes="(min-width: 1024px) 50vw, 100vw"
              photoClassName="aspect-358/229 rounded-xl lg:aspect-auto lg:h-77.75 3xl:h-90 3xl:rounded-20"
            />
          </div>
          {packages.map((item) => (
            <PriceCard
              key={item.id}
              name={item.name}
              price={item.price}
              customPriceLabel={t("custom")}
              features={item.features}
              actionLabel={t("book")}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
