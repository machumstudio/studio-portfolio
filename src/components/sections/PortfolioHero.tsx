import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  PhotoArea,
  PhotoCutCorner,
  PhotoCutFooter,
} from "@/components/ui/PhotoCut";

type PortfolioHeroProps = {
  image: { src: string; alt: string };
};

// Portfolio 페이지 히어로. 수치: docs/design/nodes/portfolio-*.json 의 첫 "Container" > "Sub Container".
// mobile: 사진(359x189, radius 14) → 간격 30 → 라벨/제목(간격 2) → 간격 24 → 소개글.
// lg/3xl: 사진 716/784 높이(radius 34)를 세 군데 깎은 BOOLEAN 모양.
//   왼쪽 위: 글 칸(폭 72%, pad 30/49 위, 간격 24/31, 라벨/제목 간격 2/4). 깎인 높이 269/328 이라 글 아래 53/57.
//   아래 줄(별 원, "아래로 내려 작업 보기")은 PhotoCutFooter. 깎는 방법은 ui/PhotoCut 주석 참고.
// 시각 비교 마스크는 사진이 실제로 보이는 사각형(위 오른쪽, 가운데, 아래 가운데)에만 건다.
export function PortfolioHero({ image }: PortfolioHeroProps) {
  const t = useTranslations("PortfolioPage.hero");

  return (
    <section aria-labelledby="portfolio-hero-title" className="page-x">
      <div className="flex flex-col gap-7.5 lg:relative lg:h-179 lg:gap-0 3xl:h-196">
        <div className="relative aspect-19/10 overflow-hidden rounded-14 bg-dark-15 lg:absolute lg:inset-0 lg:aspect-auto lg:rounded-34">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1024px) 90vw, 100vw"
            className="object-cover"
          />
          <PhotoArea className="absolute inset-0 lg:hidden" />
        </div>

        <div className="flex flex-col lg:flex-row">
          <div className="relative flex flex-col gap-6 lg:w-18/25 lg:rounded-br-34 lg:bg-dark-03 lg:pt-7.5 lg:pr-10.25 lg:pb-13.25 3xl:gap-7.75 3xl:pt-12.25 3xl:pr-13 3xl:pb-14.25">
            <hgroup className="flex flex-col gap-0.5 3xl:gap-1">
              <p className="text-eyebrow text-grey-50 uppercase">
                {t("eyebrow")}
              </p>
              <h1
                id="portfolio-hero-title"
                className="text-h1 text-white uppercase"
              >
                {t("title")}
              </h1>
            </hgroup>
            <p className="text-body text-grey-50">{t("body")}</p>
            <PhotoCutCorner className="absolute top-0 left-full hidden photo-corner-tl lg:block" />
            <PhotoCutCorner className="absolute top-full left-0 hidden photo-corner-tl lg:block" />
          </div>
          <PhotoArea className="hidden flex-1 lg:block" />
        </div>

        <PhotoArea className="hidden flex-1 lg:block" />

        <PhotoCutFooter scrollLabel={t("scroll")} />
      </div>
    </section>
  );
}
