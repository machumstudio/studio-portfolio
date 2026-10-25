import Image from "next/image";
import { useTranslations } from "next-intl";
import { CategoryMarquee } from "@/components/ui/CategoryMarquee";
import { SiteCta } from "./SiteCta";
import { categories } from "./SiteFooter";

export type HeroPhoto = { src: string; alt: string };

// 콜라주 칸 위치: 데스크톱 "Images Container"(1596 x 512) 안의 px 를 비율로 바꿔 쓴다.
// 노트북(1280 x 424), 모바일(358 x 223)의 노드 크기도 가로는 폭, 세로는 높이에 비례해 같은 비율이다.
// 노드에는 x/y 가 없어 시안 픽셀에서 칸 경계를 쟀다. 노드의 사진 6장 중 BOOLEAN_OPERATION 3장은
// 다른 칸이 페이지 배경색 테두리를 두르고 위에 겹친 모양이라, 겹치는 칸을 따로 두어 7칸이 된다.
// [left, top, width, height], 그리는 순서 = 쌓이는 순서
const W = 1596;
const H = 512;
const tiles = [
  [0, 0, 520, 354], // 왼쪽 위
  [540, 0, 653, 512], // 가운데 큰 칸
  [1206, 0, 390, 293], // 오른쪽 위
  [1206, 307, 390, 205], // 오른쪽 아래
  [0, 369, 170, 143], // 왼쪽 아래 작은 칸
  [185, 158, 577, 354], // 왼쪽 위와 가운데에 겹치는 칸
  [442, 318, 320, 194], // 그 위에 한 번 더 겹치는 칸
] as const;
// 위에 겹치는 두 칸만 배경색 테두리로 아래 칸을 깎는다 (시안 14px, 노트북/모바일은 비례)
const framed = 5;

const percent = (value: number, total: number) =>
  `${((value / total) * 100).toFixed(2)}%`;

export const heroPhotoCount = tiles.length;

// 칸마다 실제 폭에 맞춘 sizes. 콜라주 폭 = 화면 폭 - 좌우 page-x (16 / 80 / 162), 칸 폭 = 그 비율.
// 칸 하나에 같은 sizes 를 쓰면 38px 짜리 작은 칸도 384~750px 사진을 받는다 (20칸 측정)
const pageX = [
  [1920, 162],
  [1024, 80],
] as const;
const tileSizes = (width: number) => {
  const ratio = (width / W).toFixed(4);
  return [
    ...pageX.map(
      ([min, pad]) =>
        `(min-width: ${min}px) calc((100vw - ${pad * 2}px) * ${ratio})`,
    ),
    `calc((100vw - 32px) * ${ratio})`,
  ].join(", ");
};
// 가장 큰 가운데 칸이 첫 화면의 LCP 다 (Lighthouse 모바일/데스크톱). 그 칸만 먼저 받는다
const largestTile = 1;

// 노드 "Abstract Design"(262/346 정사각형): 위아래 가장자리에 중심을 둔 동심원 3겹 두 벌.
// 고리는 Dark/06 채움 + Dark/12 1px 테두리, 반지름은 시안 픽셀에서 잰 값(346 기준).
const radii = [173, 153, 131, 111, 89, 70];
function Rings({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 346 346" aria-hidden className={className}>
      {[0, 346].map((cy) =>
        radii.map((r, i) => (
          <circle
            key={`${cy}-${r}`}
            cx={173}
            cy={cy}
            r={r}
            vectorEffect="non-scaling-stroke"
            className={`stroke-dark-12 ${i % 2 === 0 ? "fill-dark-06" : "fill-dark-03"}`}
          />
        )),
      )}
    </svg>
  );
}

type HomeHeroProps = {
  /** 콜라주 사진. heroPhotoCount(7)장, 칸 순서대로 */
  photos: HeroPhoto[];
};

// 수치: docs/design/nodes/home-*.json 의 Header 다음 "Container" (mobile → lg → 3xl).
// 위 칸: 위아래 테두리 Dark/12 (헤더 아래 테두리와 붙어 2줄), pad 40 16 / 60 80 / 80 162 (테두리 inside 라 1px 뺌).
//   mobile 은 세로(간격 20), lg 부터 이름 | CTA 양끝 정렬, 가운데에 동심원 장식.
//   라벨 14/18/22 Medium Grey/40 → 간격 4/4/10 → 이름 40/60/80 SemiBold Grey/90 (대문자).
//   오른쪽은 푸터 CTA 와 같은 두 줄 + 보라 버튼 (SiteCta, 라벨 없음).
// 아래 칸: 카테고리 마키(04칸) → 콜라주 높이 223 / 424 / 512, 좌우는 page-x. 태블릿(시안 없음)은 360.
export function HomeHero({ photos }: HomeHeroProps) {
  const t = useTranslations();

  return (
    <section aria-labelledby="hero-title">
      <div className="relative flex flex-col gap-5 overflow-hidden border-y border-dark-12 page-x py-9.75 lg:flex-row lg:items-center lg:justify-between lg:py-14.75 3xl:py-19.75">
        <Rings className="absolute top-1/2 left-1/2 hidden size-65.5 -translate-1/2 lg:block 3xl:size-86.5" />
        <hgroup className="relative flex flex-col gap-1 3xl:gap-2.5">
          <p className="text-tagline text-grey-50 uppercase">
            {t("Hero.tagline")}
          </p>
          <h1
            id="hero-title"
            className="text-display whitespace-nowrap text-grey-90 uppercase"
          >
            {t("Hero.name")}
          </h1>
        </hgroup>
        <div className="relative">
          <SiteCta eyebrow={false} />
        </div>
      </div>

      <CategoryMarquee
        itemLang="en"
        label={t("Layout.categories.label")}
        pauseLabel={t("Layout.categories.pause")}
        items={categories.map((key) => t(`Layout.categories.${key}`))}
      />

      <div className="page-x">
        <div className="relative h-55.75 md:h-90 lg:h-106 3xl:h-128">
          {tiles.map(([left, top, width, height], i) => {
            const photo = photos[i];
            return (
              <div
                key={`${left}-${top}`}
                data-visual-mask
                className={`absolute overflow-hidden rounded-10 bg-dark-15 lg:rounded-2xl ${i >= framed ? "outline-3 outline-dark-03 lg:outline-11 3xl:outline-14" : ""}`}
                style={{
                  left: percent(left, W),
                  top: percent(top, H),
                  width: percent(width, W),
                  height: percent(height, H),
                }}
              >
                {photo && (
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    // 콜라주 전체가 첫 화면 안이라(모바일 포함) 지연 로드하지 않는다
                    loading="eager"
                    fetchPriority={i === largestTile ? "high" : undefined}
                    sizes={tileSizes(width)}
                    className="object-cover"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
