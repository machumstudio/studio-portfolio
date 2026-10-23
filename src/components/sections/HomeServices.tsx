import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/Button";
import { Carousel } from "@/components/ui/Carousel";
import { HighlightItem } from "@/components/ui/HighlightItem";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Link } from "@/i18n/navigation";

export type HomeService = {
  /** Services 페이지의 해당 서비스 앵커 (/services#id) */
  id: string;
  name: string;
  body: string;
  highlights: string[];
  image: { src: string; alt: string };
};

type HomeServicesProps = {
  items: HomeService[];
};

// 수치: docs/design/nodes/home-*.json 의 About 다음 "Container" (mobile → lg → 3xl).
// 제목 줄: 05칸 Carousel (한 번에 한 장, 화살표 세로 가운데) + 오른쪽 "모두 보기" outline 버튼.
// 슬라이드: mobile 세로(사진 358x301 → 간격 30 → 글), lg 부터 글 | 사진 반반 가로(간격 40/50, 세로 가운데).
//   사진 높이 301/562/625, radius 12·30(왼쪽 아래) / 20·100. 태블릿(시안 없음)은 mobile 배치에 사진 480.
//   글: 위 묶음과 하이라이트 묶음 간격 30/40/50.
//   위 묶음: 이름(text-category 28/34/44 Grey/50 대문자) + 보라 화살표 버튼(48/56/66, Button primary) 간격 4/10/16,
//     → 간격 12/16/20 → 설명 14/16/18 Regular 150% Grey/50.
//   하이라이트: "Service Highlights" 14/16/18 Medium 150% Grey/80 → 간격 10/16/20 → 목록 간격 8/10/10.
//     HighlightItem 은 Services 페이지 수치라 홈 값으로 덮어쓴다: mobile pad 14 r8, lg 간격 10.
export function HomeServices({ items }: HomeServicesProps) {
  const t = useTranslations("Services");

  return (
    <Carousel
      labelledBy="services-title"
      className="page-x"
      alignControls="center"
      slideClassName="md:w-full lg:w-full"
      previousLabel={t("previous")}
      nextLabel={t("next")}
      slideLabels={items.map((_, i) =>
        t("slide", { index: i + 1, total: items.length }),
      )}
      header={
        <SectionHeading
          id="services-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          divider={false}
        />
      }
      actions={
        <Link href="/services" className={buttonStyles({ variant: "outline" })}>
          {t("all")}
          <ArrowRight aria-hidden />
        </Link>
      }
    >
      {items.map((item) => (
        <article
          key={item.id}
          aria-labelledby={`service-${item.id}`}
          className="flex w-full flex-col gap-7.5 lg:flex-row lg:items-center lg:gap-10 3xl:gap-12.5"
        >
          <div className="flex flex-col gap-7.5 lg:flex-1 lg:gap-10 3xl:gap-12.5">
            <div className="flex flex-col gap-3 lg:gap-4 3xl:gap-5">
              <div className="flex items-center gap-1 lg:gap-2.5 3xl:gap-4">
                <h3
                  id={`service-${item.id}`}
                  className="text-category text-grey-50 uppercase"
                >
                  {item.name}
                </h3>
                <Link
                  href={`/services#${item.id}`}
                  aria-label={t("more", { name: item.name })}
                  className={buttonStyles()}
                >
                  <ArrowUpRight aria-hidden />
                </Link>
              </div>
              <p className="text-body break-keep text-grey-50">{item.body}</p>
            </div>
            <div className="flex flex-col gap-2.5 lg:gap-4 3xl:gap-5">
              <h4 className="text-body font-medium text-grey-80">
                {t("highlights")}
              </h4>
              <ul className="flex flex-col gap-2 lg:gap-2.5">
                {item.highlights.map((highlight) => (
                  <HighlightItem
                    key={highlight}
                    className="rounded-lg px-3.25 break-keep lg:gap-2.5 lg:rounded-10"
                  >
                    {highlight}
                  </HighlightItem>
                ))}
              </ul>
            </div>
          </div>
          <div
            data-visual-mask
            className="relative order-first h-75.25 shrink-0 overflow-hidden rounded-xl rounded-bl-30 bg-dark-15 md:h-120 lg:order-none lg:h-140.5 lg:flex-1 lg:rounded-20 lg:rounded-bl-100 3xl:h-156.25"
          >
            <Image
              src={item.image.src}
              alt={item.image.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </article>
      ))}
    </Carousel>
  );
}
