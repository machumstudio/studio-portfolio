import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/Button";
import { MobileMenu } from "@/components/ui/MobileMenu";
import { NavLink } from "@/components/ui/NavLink";
import { Link } from "@/i18n/navigation";

// match: 그 메뉴를 현재로 보는 경로 접두사. 작업 상세(/work/...)는 포트폴리오 아래로 본다
const links: {
  href: string;
  key: "home" | "about" | "portfolio" | "services";
  match?: readonly string[];
}[] = [
  { href: "/", key: "home" },
  { href: "/about", key: "about" },
  { href: "/portfolio", key: "portfolio", match: ["/portfolio", "/work"] },
  { href: "/services", key: "services" },
];

const focusRing =
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-purple-70";

// 수치: docs/design/nodes/home-*.json 의 "Header"(lg/3xl), "Navbar"(mobile).
// mobile: 좌우 16 안쪽에 세로선(Dark/12) 상자, 상자 안 pad 40 0 0 16, 높이 108(아래 테두리 포함).
// lg/3xl: 바깥 pad 62/125, 안쪽 세로선 상자 pad 20 18 / 30 40, 높이 89/119.
//   메뉴는 가운데, 헤더 아래 테두리에 붙는다. 위쪽 모서리 radius 12/16(시안 픽셀 실측), 칸마다 오른쪽 구분선.
//   칸 pad 24 30 / 30 40, 글자 14/18 Medium. 현재 페이지는 Dark/08 배경 + 흰 글자, 나머지는 Grey/70.
// 시안의 Home 칸만 pad 40/50 인 것은 현재 표시 인스턴스라서다. 페이지마다 폭이 바뀌지 않게 모든 칸을 30/40 으로 둔다.
export function SiteHeader() {
  const t = useTranslations("Layout");

  return (
    <header className="relative border-b border-dark-12 px-4 lg:px-15.5 3xl:px-31.25">
      <div className="flex items-center justify-between border-x border-dark-12 pt-10 pl-4 lg:px-4.5 lg:pt-5 lg:pb-4.75 3xl:px-10 3xl:pt-7.5 3xl:pb-7.25">
        <Link
          href="/"
          className={`text-logo whitespace-nowrap text-white uppercase ${focusRing} focus-visible:outline-offset-4`}
        >
          {t("brand")}
        </Link>

        <nav
          aria-label={t("nav.label")}
          className="absolute bottom-0 left-1/2 hidden -translate-x-1/2 overflow-hidden rounded-t-xl border-t border-l border-dark-12 lg:block 3xl:rounded-t-2xl"
        >
          <ul className="flex">
            {links.map(({ href, key, match }) => (
              <li key={key}>
                <NavLink
                  href={href}
                  match={match}
                  className={`block border-r border-dark-12 px-7.5 py-6 text-button whitespace-nowrap text-grey-70 transition-colors hover:text-white aria-[current=page]:bg-dark-08 aria-[current=page]:text-white 3xl:px-10 3xl:py-7.5 ${focusRing}`}
                >
                  {t(`nav.${key}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/contact"
          className={buttonStyles({
            variant: "outline",
            className: "max-lg:hidden",
          })}
        >
          {t("nav.contact")}
        </Link>

        <MobileMenu openLabel={t("menu.open")} closeLabel={t("menu.close")}>
          <nav aria-label={t("nav.label")}>
            <ul className="flex flex-col border-x border-dark-12 px-4">
              {links.map(({ href, key, match }) => (
                <li key={key} className="border-b border-dark-12">
                  <NavLink
                    href={href}
                    match={match}
                    className={`flex items-center justify-between py-5 text-h2 text-grey-70 aria-[current=page]:text-white ${focusRing}`}
                  >
                    {t(`nav.${key}`)}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="border-x border-dark-12 px-4 py-10">
              <Link
                href="/contact"
                className={buttonStyles({ className: "w-full" })}
              >
                {t("nav.contact")}
              </Link>
            </div>
          </nav>
        </MobileMenu>
      </div>
    </header>
  );
}
