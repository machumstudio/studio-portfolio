import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  PhotoArea,
  PhotoCutCorner,
  PhotoCutFooter,
} from "@/components/ui/PhotoCut";

type ServicesHeroProps = {
  image: { src: string; alt: string };
};

// Services 페이지 히어로. 수치: docs/design/nodes/services-*.json 의 첫 "Container".
// mobile: 사진(357x219, radius 14) → 간격 30 → 라벨/제목(간격 2) → 간격 24 → 소개글. Portfolio 와 사진 비율만 다르다.
// lg/3xl: 사진 712/784 높이를 깎은 BOOLEAN 모양. Portfolio 와 달리 글 칸이 오른쪽 위에 있고 (노드 pad 왼쪽 200/300),
//   노트북 사진 radius 가 24 라(데스크톱 34) photo-cut-24 로 모서리 조각 크기를 바꾼다.
//   글 칸: 깎인 자리 왼쪽 165/261, 글은 그 안쪽 35/39 (글 폭 1080/1296 = 노드 Text Container 폭),
//   pad 위 20, 아래 20/37 (깎인 높이 202/252, 시안 픽셀), 라벨/제목 간격 2/4, 소개글까지 24/31.
//   아래 줄(별 원, 아래로 내려 보라는 안내)은 노드 값이 Portfolio 와 같아 PhotoCutFooter.
// 시각 비교 마스크는 사진이 실제로 보이는 사각형(위 왼쪽, 가운데, 아래 가운데)에만 건다.
export function ServicesHero({ image }: ServicesHeroProps) {
  const t = useTranslations("ServicesPage.hero");

  return (
    <section aria-labelledby="services-hero-title" className="page-x">
      <div className="flex flex-col gap-7.5 lg:relative lg:h-178 lg:gap-0 lg:photo-cut-24 3xl:h-196 3xl:photo-cut-34">
        <div className="relative aspect-357/219 overflow-hidden rounded-14 bg-dark-15 lg:absolute lg:inset-0 lg:aspect-auto lg:rounded-photo-cut">
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
          <PhotoArea className="hidden w-41.25 lg:block 3xl:w-65.25" />
          <div className="relative flex flex-col gap-6 lg:flex-1 lg:rounded-bl-photo-cut lg:bg-dark-03 lg:py-5 lg:pl-8.75 3xl:gap-7.75 3xl:pb-9.25 3xl:pl-9.75">
            <hgroup className="flex flex-col gap-0.5 3xl:gap-1">
              <p className="text-eyebrow text-grey-50 uppercase">
                {t("eyebrow")}
              </p>
              <h1
                id="services-hero-title"
                className="text-h1 text-white uppercase"
              >
                {t("title")}
              </h1>
            </hgroup>
            <p className="text-body text-grey-50">{t("body")}</p>
            <PhotoCutCorner className="absolute top-0 right-full hidden photo-corner-tr lg:block" />
            <PhotoCutCorner className="absolute top-full right-0 hidden photo-corner-tr lg:block" />
          </div>
        </div>

        <PhotoArea className="hidden flex-1 lg:block" />

        <PhotoCutFooter scrollLabel={t("scroll")} />
      </div>
    </section>
  );
}
