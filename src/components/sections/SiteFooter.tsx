import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { siFacebook, siInstagram, siX } from "simple-icons";
import { buttonStyles } from "@/components/ui/Button";
import { CategoryMarquee } from "@/components/ui/CategoryMarquee";
import { Link } from "@/i18n/navigation";

// 링크 4열. 아직 없는 페이지(/about 등)는 각 칸에서 만든다. 카테고리는 09칸 필터의 쿼리 값
const columns = [
  {
    key: "home",
    links: [
      { key: "about", href: "/about" },
      { key: "works", href: "/portfolio" },
      { key: "testimonials", href: "/#testimonials" },
    ],
  },
  {
    key: "clients",
    links: [
      { key: "klovesto", href: "/portfolio" },
      { key: "nukeway", href: "/portfolio" },
      { key: "clovens", href: "/portfolio" },
      { key: "menvol", href: "/portfolio" },
    ],
  },
  {
    key: "portfolio",
    links: [
      { key: "events", href: "/portfolio?category=events" },
      { key: "portrait", href: "/portfolio?category=portrait" },
      { key: "branding", href: "/portfolio?category=branding" },
      { key: "commercial", href: "/portfolio?category=commercial" },
      { key: "wedding", href: "/portfolio?category=wedding" },
    ],
  },
  {
    key: "services",
    links: [
      { key: "portraits", href: "/services#portrait" },
      { key: "events", href: "/services#events" },
      { key: "commercial", href: "/services#commercial" },
    ],
  },
] as const;

export const categories = [
  "event",
  "commercial",
  "product",
  "wedding",
  "landscape",
  "branding",
  "portrait",
] as const;

// 가상 스튜디오라 계정이 없다. 각 서비스 첫 화면으로 둔다
const socials = [
  { key: "instagram", href: "https://www.instagram.com/", icon: siInstagram },
  { key: "facebook", href: "https://www.facebook.com/", icon: siFacebook },
  { key: "x", href: "https://x.com/", icon: siX },
] as const;

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-70";

// 양옆 여백의 장식 줄 3개 (노드 "Abstract Design" 187/200 정사각형, 줄 37/40 간격 38/40, Dark/12)
function Stripes({ side }: { side: "left" | "right" }) {
  return (
    <div
      aria-hidden
      className={`absolute top-1/2 hidden w-20 -translate-y-1/2 flex-col gap-9.5 lg:flex 3xl:w-9.75 3xl:gap-10 ${side === "left" ? "left-0" : "right-0"}`}
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-9.25 bg-dark-12 3xl:h-10" />
      ))}
    </div>
  );
}

type SiteFooterProps = {
  /** 왼쪽 칸 (보통 SiteCta) */
  cta?: ReactNode;
  /** 저작권 연도 */
  year: number;
};

// 수치: docs/design/nodes/home-*.json 의 마지막 "Container" (워드마크 + 마키 + "Footer").
// 워드마크: Dark/15, 오른쪽 정렬(오른쪽 pad 16/80/162), 마키까지 간격 20/60/100.
// 본문: mobile 은 CTA 상자(pad 40 20) 아래 링크 상자(pad 40 20, 2열 x 2줄, 열 간격 50 줄 간격 40),
//   1440(xl) 부터 CTA(폭 521/644, pad 80 60 / 100 80. 언어마다 글자 폭이 달라 폭을 고정) | 링크 4열(pad 80 50 / 100 80). 세로선은 Dark/12.
//   링크 열은 시안의 양끝 정렬 대신 왼쪽부터 일정한 간격 100/111 (시안 en 글자 폭에서 양끝 정렬이 만든 간격).
//   한국어는 글자가 짧아 양끝 정렬이면 열 사이가 벌어지고 마지막 열이 오른쪽 끝에 붙는다.
//   1024~1439(시안 없음): 링크 4열이 CTA 옆에 들어가지 않아(en 최소 약 760) CTA 위 / 링크 아래로 쌓는다.
//   md 부터 링크는 4열 한 줄, mobile 은 2x2. 열 제목과 링크는 줄을 바꾸지 않는다 (한국어가 글자 단위로 꺾이지 않게).
// 링크 열: 제목(14/14/18 SemiBold Grey/50) → 16/16/20 → 링크(14/14/18 Medium Grey/95, pad 6 0,
//   아래 테두리 Dark/20) 간격 4/4/6.
// 하단: mobile 세로 가운데(간격 16, pad 20 16), lg 부터 약관 | 소셜 | 저작권 (높이 89/107).
//   소셜 묶음 Dark/03 + 테두리 Dark/12 알약(pad 8/10, 간격 8/10), 버튼은 icon Button(38/48).
export function SiteFooter({ cta, year }: SiteFooterProps) {
  const t = useTranslations("Layout");

  return (
    <footer className="flex flex-col">
      <div className="flex flex-col items-end gap-5 overflow-hidden lg:gap-15 3xl:gap-25">
        {/* 브랜드 로고타입 장식 (Dark/15, 1.28:1). 글자는 CSS content 로 그려 화면 낭독기와 명도 대비 검사에서 본문으로 보지 않는다
            (WCAG 1.4.3 로고타입 예외, docs/accessibility.md). 스튜디오 이름은 아래 저작권 줄에 글자로 있다 */}
        <p
          aria-hidden
          data-text={t("wordmark")}
          className="pr-4 text-wordmark whitespace-nowrap text-dark-15 uppercase decorative-text lg:pr-20 3xl:pr-40.5"
        />
        <CategoryMarquee
          itemLang="en"
          className="w-full"
          label={t("categories.label")}
          pauseLabel={t("categories.pause")}
          items={categories.map((key) => t(`categories.${key}`))}
        />
      </div>

      <div className="relative px-4 lg:px-20 xl:flex 3xl:px-40.5">
        <Stripes side="left" />
        <div className="border-x border-b border-dark-12 px-5 py-10 lg:px-15 lg:py-20 xl:w-130.25 xl:shrink-0 xl:border-b-0 3xl:w-161 3xl:px-20 3xl:py-25">
          {cta}
        </div>
        <nav
          aria-label={t("footer.label")}
          className="border-x border-dark-12 px-5 py-10 lg:px-15 lg:py-20 xl:flex-1 xl:border-l-0 xl:px-12.5 3xl:px-20 3xl:py-25"
        >
          <ul className="grid w-fit grid-cols-2 gap-x-12.5 gap-y-10 px-5 md:flex lg:gap-x-25 lg:px-0 3xl:gap-x-27.75">
            {columns.map((column) => (
              <li
                key={column.key}
                className="flex flex-col gap-3.5 lg:gap-4 3xl:gap-5"
              >
                <h2
                  id={`footer-${column.key}`}
                  className="text-caption font-semibold whitespace-nowrap text-grey-50 uppercase"
                >
                  {t(`footer.${column.key}.title`)}
                </h2>
                <ul
                  aria-labelledby={`footer-${column.key}`}
                  className="flex flex-col gap-1 3xl:gap-1.5"
                >
                  {column.links.map((link) => (
                    <li key={link.key}>
                      <Link
                        href={link.href}
                        className={`block w-fit border-b border-dark-20 pt-1.5 pb-1.25 text-caption font-medium whitespace-nowrap text-grey-95 uppercase transition-colors hover:text-white ${focusRing}`}
                      >
                        {t(`footer.${column.key}.${link.key}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
        <Stripes side="right" />
      </div>

      <div className="flex flex-col items-center gap-4 border-t border-dark-12 px-4 py-5 text-center text-button font-normal text-grey-50 lg:grid lg:grid-cols-3 lg:px-20 lg:py-4.25 3xl:px-40.5 3xl:py-4.75">
        <ul className="flex items-center gap-2 lg:justify-self-start 3xl:gap-2.75">
          <li>
            <Link href="/terms" className={`hover:text-white ${focusRing}`}>
              {t("footer.terms")}
            </Link>
          </li>
          <li aria-hidden className="h-5.25 w-px bg-dark-12 3xl:h-6.75" />
          <li>
            <Link href="/privacy" className={`hover:text-white ${focusRing}`}>
              {t("footer.privacy")}
            </Link>
          </li>
        </ul>
        <div className="lg:order-3 lg:justify-self-end lg:text-right">
          <p>{t("footer.copyright", { year })}</p>
          <p>
            <a
              href="https://www.figma.com/community/file/1324089527430438614"
              target="_blank"
              rel="noopener noreferrer"
              className={`hover:text-white ${focusRing}`}
            >
              {t("footer.credit")}
              <span className="sr-only"> ({t("footer.newTab")})</span>
            </a>
          </p>
        </div>
        <ul
          aria-label={t("footer.social.label")}
          className="flex gap-2 rounded-full border border-dark-12 bg-dark-03 p-1.75 lg:order-2 lg:justify-self-center 3xl:gap-2.5 3xl:p-2.25"
        >
          {socials.map(({ key, href, icon }) => (
            <li key={key}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t(`footer.social.${key}`)} (${t("footer.newTab")})`}
                className={buttonStyles({ variant: "icon", size: "md" })}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d={icon.path} />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
