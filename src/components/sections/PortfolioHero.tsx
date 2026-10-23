import { Sparkle } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

type PortfolioHeroProps = {
  image: { src: string; alt: string };
};

// 사진 모서리 조각(꾸밈)
const Decor = ({ className }: { className: string }) => (
  <span aria-hidden className={className} />
);
// 사진이 보이는 사각형. 시각 비교에서 가린다 (안 보이는 크기에서는 display:none 이라 크기 0)
const PhotoArea = ({ className }: { className: string }) => (
  <span aria-hidden data-visual-mask className={className} />
);

// Portfolio 페이지 히어로. 수치: docs/design/nodes/portfolio-*.json 의 첫 "Container" > "Sub Container".
// mobile: 사진(359x189, radius 14) → 간격 30 → 라벨/제목(간격 2) → 간격 24 → 소개글.
// lg/3xl: 사진 716/784 높이(radius 34)를 세 군데 깎은 BOOLEAN 모양.
//   왼쪽 위: 글 칸(폭 72%, pad 30/49 위, 간격 24/31, 라벨/제목 간격 2/4). 깎인 높이 269/328 이라 글 아래 53/57.
//   아래 줄(높이 136/173): 왼쪽 별 원(100/137, pad 18 32 18 20) / 오른쪽 "아래로 내려 작업 보기"(폭 164/205, pad 왼쪽 70/62 오른쪽 20/50).
// 깎인 자리는 배경색 칸이 사진 위에 올라앉아 만든다. 칸의 안쪽 모서리는 radius 34,
// 칸 옆 사진 모서리는 photo-corner-* 조각으로 둥글게 덮는다.
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
            preload
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
            <Decor className="absolute top-0 left-full hidden photo-corner-tl lg:block" />
            <Decor className="absolute top-full left-0 hidden photo-corner-tl lg:block" />
          </div>
          <PhotoArea className="hidden flex-1 lg:block" />
        </div>

        <PhotoArea className="hidden flex-1 lg:block" />

        <div className="hidden lg:flex lg:h-34 3xl:h-43.25">
          <div className="relative flex items-center rounded-tr-34 bg-dark-03 pr-8 pl-5">
            <span
              aria-hidden
              className="flex size-25 items-center justify-center rounded-full border border-dark-20 3xl:size-34.25"
            >
              <Sparkle
                className="size-16.5 fill-dark-20 text-dark-20 3xl:size-22.5"
                strokeWidth={0}
              />
            </span>
            <Decor className="absolute bottom-full left-0 photo-corner-bl" />
            <Decor className="absolute bottom-0 left-full photo-corner-bl" />
          </div>
          <PhotoArea className="flex-1" />
          <div className="relative flex items-center rounded-tl-34 bg-dark-03 pr-5 pl-17.5 3xl:pr-12.5 3xl:pl-15.5">
            <p className="w-41 text-caption font-medium text-grey-50 uppercase 3xl:w-51.25">
              {t("scroll")}
            </p>
            <Decor className="absolute right-0 bottom-full photo-corner-br" />
            <Decor className="absolute right-full bottom-0 photo-corner-br" />
          </div>
        </div>
      </div>
    </section>
  );
}
