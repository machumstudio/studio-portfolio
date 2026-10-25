import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { buttonStyles } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { SkipLink } from "@/components/ui/SkipLink";
import { signOutAction } from "@/features/admin-auth/actions";
import { adminInquiriesPath } from "@/features/inquiry/admin-view";
import { countAdminInquiries } from "@/features/inquiry/queries";
import { AdminMain } from "./admin-main";

export type AdminSection = "works" | "inquiries";

const sections: { key: AdminSection; href: string }[] = [
  { key: "works", href: "/admin" },
  { key: "inquiries", href: adminInquiriesPath },
];

// 관리자 화면 공통 틀: 브랜드(작업 목록으로), 메뉴(작업/문의, 새 문의 N건), 로그인한 계정, 로그아웃(일반 form POST 라 JS 없이도 된다).
// 새 문의 수는 화면을 그릴 때마다 센다. 상태를 바꾸는 액션이 관리자 화면 전체를 다시 그리게 해서 바로 맞는다
export async function AdminShell({
  email,
  section,
  needsScript = false,
  children,
}: {
  email: string;
  /** 지금 보고 있는 메뉴 */
  section: AdminSection;
  /** 편집 화면: JS 가 꺼져 있으면 안내한다 (docs/adr/0015) */
  needsScript?: boolean;
  children: ReactNode;
}) {
  const works = await getTranslations({
    locale: "ko",
    namespace: "AdminWorks",
  });
  const t = await getTranslations({
    locale: "ko",
    namespace: "AdminDashboard",
  });
  const layout = await getTranslations({ locale: "ko", namespace: "Layout" });
  const counts = await countAdminInquiries(
    sections.find((s) => s.key === section)!.href,
  );
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink>{layout("skipToContent")}</SkipLink>
      <header className="flex flex-wrap items-center gap-x-5 gap-y-2.5 border-b border-dark-12 page-x py-5">
        <Link
          href="/admin"
          className="text-label text-grey-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-70"
        >
          {layout("brand")} <span className="text-grey-50">{t("label")}</span>
        </Link>
        <nav
          aria-label={t("nav.label")}
          className="order-last w-full lg:order-none lg:mr-auto lg:w-auto"
        >
          <ul className="flex flex-wrap items-center gap-2.5">
            {sections.map(({ key, href }) => {
              const current = key === section;
              return (
                <li key={key}>
                  <Link
                    href={href}
                    aria-current={current ? "page" : undefined}
                    className={cx(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-label transition-colors",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-70",
                      current
                        ? "bg-dark-15 text-white"
                        : "text-grey-70 hover:text-white",
                    )}
                  >
                    {t(`nav.${key}`)}
                    {key === "inquiries" && counts.New > 0 && (
                      <>
                        {" "}
                        <span className="rounded-full bg-purple-55 px-2 py-0.5 text-caption text-white">
                          {t("nav.newInquiries", { count: counts.New })}
                        </span>
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <p className="ml-auto text-body text-grey-50 lg:ml-0">
          {t("signedInAs", { email })}
        </p>
        <form action={signOutAction}>
          <button
            type="submit"
            className={buttonStyles({ variant: "outline" })}
          >
            {t("signOut")}
          </button>
        </form>
      </header>
      <AdminMain className="mx-auto flex w-full max-w-6xl flex-col page-x pt-10 pb-20 lg:pt-15">
        {needsScript && (
          <noscript>
            <p className="mb-10 rounded-10 border border-purple-70 px-5 py-4 text-body text-grey-90">
              {works("editor.noscript")}
            </p>
          </noscript>
        )}
        {children}
      </AdminMain>
    </div>
  );
}
