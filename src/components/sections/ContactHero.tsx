import Image from "next/image";
import { useTranslations } from "next-intl";
import { siFacebook, siInstagram, siX } from "simple-icons";
import { buttonStyles } from "@/components/ui/Button";
import { PhotoArea, PhotoCutCorner } from "@/components/ui/PhotoCut";

// 시안은 Facebook, Twitter, LinkedIn 이지만 LinkedIn 은 simple-icons 에서 빠졌다.
// 홈 About, 푸터, 후기와 같은 세 서비스로 맞춘다. 가상 스튜디오라 각 서비스 첫 화면으로 둔다
const socials = [
  { key: "instagram", href: "https://www.instagram.com/", icon: siInstagram },
  { key: "facebook", href: "https://www.facebook.com/", icon: siFacebook },
  { key: "x", href: "https://x.com/", icon: siX },
] as const;

type ContactHeroProps = {
  image: { src: string; alt: string };
};

// Contact 페이지 히어로. 수치: docs/design/nodes/contact-*.json 의 첫 "Container" > "Sub Container".
// mobile: 사진(357x229, radius 10) 아래 가운데를 소셜 알약이 24 만큼 파고든다 → 간격 30 → 라벨/제목(간격 2) → 24 → 소개글.
//   사진의 파인 자리는 노드가 BOOLEAN 이라 시안 픽셀에서 잼: 위 폭 146, 깊이 34, 양옆이 radius 34 로 둥글게 퍼진다.
// lg/3xl: 사진 632/746 높이, radius 34 를 세 군데 깎는다 (자리는 시안 픽셀, 글 위치는 노드 pad 180/230 과 맞다).
//   글 칸: 왼쪽 붙음, 위 142/168, 폭 821/1106 (오른쪽 459/490 비움), 글은 pad 위 38/62 아래 37/60 오른쪽 41/10 → 글 폭 780/1096.
//     라벨/제목 간격 2/4, 소개글까지 20/24.
//   소셜 칸: 오른쪽 붙음, 위 62/73, 229x102 / 260x130, 왼쪽이 둥근 알약 모양. 알약은 오른쪽 끝, 세로 가운데.
//   아래로 안내 칸: 오른쪽 아래, 235x104 / 293x123, 글 14/18 Medium Grey/50 폭 179/205, pad 위 40 왼쪽 35/43.
//   소셜 알약: Dark/03 + 테두리 Dark/12, pad 6/8/10 (테두리 포함), 버튼 50/60/68 간격 6/8/10, 아이콘 18/20/20.
// 시각 비교 마스크는 사진이 실제로 보이는 사각형에만 건다 (글 칸 오른쪽과 소셜 칸 아래 사이 230 폭 띠, 글 칸 아래 띠 포함).
export function ContactHero({ image }: ContactHeroProps) {
  const t = useTranslations("ContactPage.hero");
  const social = useTranslations("Layout.footer");

  return (
    <section aria-labelledby="contact-hero-title" className="page-x">
      <div className="flex flex-col gap-7.5 lg:relative lg:block lg:h-158 3xl:h-186.5">
        <div className="relative flex flex-col gap-6 max-lg:order-last lg:absolute lg:top-35.5 lg:right-114.75 lg:left-0 lg:z-10 lg:gap-5 lg:rounded-r-photo-cut lg:bg-dark-03 lg:pt-9.5 lg:pr-10.25 lg:pb-9.25 3xl:top-42 3xl:right-122.5 3xl:gap-6 3xl:pt-15.5 3xl:pr-2.5 3xl:pb-15">
          <hgroup className="flex flex-col gap-0.5 3xl:gap-1">
            <p className="text-eyebrow text-grey-50 uppercase">
              {t("eyebrow")}
            </p>
            <h1
              id="contact-hero-title"
              className="text-h1 text-white uppercase"
            >
              {t("title")}
            </h1>
          </hgroup>
          <p className="text-body text-grey-50">{t("body")}</p>
          <PhotoCutCorner className="absolute bottom-full left-0 hidden photo-corner-bl lg:block" />
          <PhotoCutCorner className="absolute top-full left-0 hidden photo-corner-tl lg:block" />
          {/* 글 칸 높이는 문구 길이에 따라 달라서(한국어는 시안보다 짧다), 칸 바로 아래부터 아래 사진 자리까지 가린다 */}
          <PhotoArea className="absolute inset-x-0 top-full hidden h-16 lg:block" />
        </div>

        <div className="relative flex flex-col items-center lg:contents">
          <div className="relative aspect-357/229 w-full overflow-hidden rounded-10 bg-dark-15 lg:absolute lg:inset-0 lg:aspect-auto lg:rounded-34">
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
            <PhotoArea className="absolute inset-x-0 top-0 hidden h-15.5 lg:block 3xl:h-18.25" />
            <PhotoArea className="absolute top-15.5 right-57.25 left-0 hidden h-20 lg:block 3xl:top-18.25 3xl:right-65 3xl:h-23.75" />
            <PhotoArea className="absolute top-35.5 right-57.25 hidden h-5.25 w-57.5 lg:block 3xl:top-42 3xl:right-65 3xl:h-8.75" />
            <PhotoArea className="absolute top-40.75 right-0 bottom-26 hidden w-114.75 lg:block 3xl:top-50.75 3xl:bottom-30.75 3xl:w-122.5" />
            <PhotoArea className="absolute right-58.75 bottom-0 left-0 hidden h-58.25 lg:block 3xl:right-73.25 3xl:h-60.25" />
            {/* mobile: 알약이 들어앉는 파인 자리 */}
            <span
              aria-hidden
              className="absolute bottom-0 left-1/2 h-8.5 w-53.5 -translate-x-1/2 rounded-t-34 bg-dark-03 lg:hidden"
            >
              <PhotoCutCorner className="absolute right-full bottom-0 photo-corner-br" />
              <PhotoCutCorner className="absolute bottom-0 left-full photo-corner-bl" />
            </span>
          </div>

          {/* lg: 소셜 알약 자리 */}
          <span
            aria-hidden
            className="absolute top-15.5 right-0 hidden h-25.5 w-57.25 rounded-l-full bg-dark-03 lg:block 3xl:top-18.25 3xl:h-32.5 3xl:w-65"
          >
            <PhotoCutCorner className="absolute right-0 bottom-full photo-corner-br" />
            <PhotoCutCorner className="absolute top-full right-0 photo-corner-tr" />
          </span>

          <ul
            aria-label={social("social.label")}
            className="relative -mt-6 flex gap-1.5 rounded-full border border-dark-12 bg-dark-03 p-1.25 lg:absolute lg:top-18.75 lg:right-0 lg:mt-0 lg:gap-2 lg:p-1.75 3xl:top-23.5 3xl:gap-2.5 3xl:p-2.25"
          >
            {socials.map(({ key, href, icon }) => (
              <li key={key}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${social(`social.${key}`)} (${social("newTab")})`}
                  className={buttonStyles({
                    variant: "icon",
                    size: "md",
                    className:
                      "size-12.5 lg:size-15 3xl:size-17 [&_svg]:size-4.5 lg:[&_svg]:size-5 3xl:[&_svg]:size-5",
                  })}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d={icon.path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="absolute right-0 bottom-0 hidden h-26 w-58.75 rounded-tl-photo-cut bg-dark-03 pt-10 pl-8.75 lg:block 3xl:h-30.75 3xl:w-73.25 3xl:pl-10.75">
          <p className="w-44.75 text-caption font-medium text-grey-50 uppercase 3xl:w-51.25">
            {t("scroll")}
          </p>
          <PhotoCutCorner className="absolute right-0 bottom-full photo-corner-br" />
          <PhotoCutCorner className="absolute right-full bottom-0 photo-corner-br" />
        </div>
      </div>
    </section>
  );
}
