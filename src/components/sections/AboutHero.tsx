import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  PhotoArea,
  PhotoCutCorner,
  PhotoCutFooter,
} from "@/components/ui/PhotoCut";

export type AboutStat = {
  id: string;
  /** 숫자 ("15+", "90%") */
  value: string;
  /** 설명 ("촬영 경력(년)") */
  label: string;
};

type AboutHeroProps = {
  image: { src: string; alt: string };
  stats: AboutStat[];
};

// About 페이지 소개. 수치: docs/design/nodes/about-*.json 의 첫 "Container" > "Sub Container".
// mobile: 사진(357x236, radius 20) → 간격 30 → 라벨/제목(간격 0) → 간격 24 → 통계 2열(간격 10).
// lg/3xl: 사진 784 높이(radius 34)를 깎은 BOOLEAN 모양. 노드에 깎인 좌표가 없어 시안 픽셀로 쟀다 (1440 / 1920):
//   왼쪽 위 글 칸: 폭 542/658(제목이 길면 늘어난다), 깎인 높이 272/346. 칸 오른쪽 위로 사진이 98/117 높이만큼 보인다.
//   통계 띠: 위 98/117 부터 243/310 까지 가로 전체. 띠 아래로 사진이 다시 보이고, 글 칸 밑은 272/346 부터.
//   띠 아래 계단(29/36)은 글 칸의 오른쪽 아래 radius 34 하나로 잇는다 (계단이 34 보다 낮아 사진 쪽 모서리 조각을 두면 뾰족해진다).
//   통계는 제목 아래 24/31 (띠 위에서 16/24), 6칸 한 줄 간격 10/20.
//   아래 줄(별 원, 아래로 내려 보라는 안내)은 PhotoCutFooter (Portfolio 히어로와 같다).
// 통계 카드: Dark/06 + 테두리 Dark/12, radius 12, pad 20 14 / 20 24 / 24 30 (테두리 inside 라 1px 뺌).
//   숫자 28/34/48 SemiBold 흰색 + 설명 14/14/18 Regular 150% Grey/50. mobile 은 가운데 정렬(시안 이미지).
//   숫자와 설명 목록이라 <dl>. 읽는 순서는 설명 → 숫자, 보이는 순서는 숫자 → 설명 (flex-col-reverse).
// 태블릿(시안 없음): mobile 구성에 통계 3열.
export function AboutHero({ image, stats }: AboutHeroProps) {
  const t = useTranslations("AboutPage.hero");

  return (
    <section aria-labelledby="about-hero-title" className="page-x">
      <div className="flex flex-col gap-7.5 lg:relative lg:h-196 lg:gap-0">
        <div className="relative aspect-357/236 overflow-hidden rounded-20 bg-dark-15 lg:absolute lg:inset-0 lg:aspect-auto lg:rounded-34">
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

        <div className="flex flex-col gap-6 lg:gap-0">
          <div className="lg:flex lg:h-24.5 lg:items-start 3xl:h-29.25">
            <div className="relative lg:h-68 lg:min-w-135.5 lg:rounded-br-34 lg:bg-dark-03 3xl:h-86.5 3xl:min-w-164.5">
              <hgroup className="flex flex-col lg:gap-0.5 3xl:gap-1">
                <p className="text-eyebrow text-grey-50 uppercase">
                  {t("eyebrow")}
                </p>
                <h1
                  id="about-hero-title"
                  className="text-h1 text-white uppercase lg:pr-6 lg:whitespace-nowrap"
                >
                  {t("title")}
                </h1>
              </hgroup>
              <PhotoCutCorner className="absolute top-0 left-full hidden photo-corner-tl lg:block" />
              <PhotoCutCorner className="absolute top-16 left-full hidden photo-corner-bl lg:block 3xl:top-20.75" />
              <PhotoCutCorner className="absolute top-full left-0 hidden photo-corner-tl lg:block" />
            </div>
            <PhotoArea className="hidden h-full flex-1 lg:block" />
          </div>

          <div className="relative lg:h-36.25 lg:bg-dark-03 lg:pt-4 3xl:h-48.25 3xl:pt-6">
            <dl className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-6 3xl:gap-5">
              {stats.map(({ id, value, label }) => (
                <div
                  key={id}
                  className="flex flex-col-reverse rounded-xl border border-dark-12 bg-dark-06 px-3.25 py-4.75 text-center lg:px-5.75 lg:text-left 3xl:px-7.25 3xl:py-5.75"
                >
                  <dt className="text-caption leading-normal text-grey-50">
                    {label}
                  </dt>
                  <dd className="text-stat text-white uppercase">{value}</dd>
                </div>
              ))}
            </dl>
            <PhotoCutCorner className="absolute right-0 bottom-full hidden photo-corner-br lg:block" />
            <PhotoCutCorner className="absolute top-full right-0 hidden photo-corner-tr lg:block" />
          </div>
        </div>

        <div className="hidden lg:flex lg:h-7.25 3xl:h-9">
          <div className="w-135.5 3xl:w-164.5" />
          <PhotoArea className="flex-1" />
        </div>
        <PhotoArea className="hidden flex-1 lg:block" />

        <PhotoCutFooter scrollLabel={t("scroll")} />
      </div>
    </section>
  );
}
