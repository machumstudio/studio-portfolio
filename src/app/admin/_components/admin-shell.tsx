import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { buttonStyles } from "@/components/ui/Button";
import { signOutAction } from "@/features/admin-auth/actions";

// 관리자 화면 공통 틀: 브랜드(목록으로), 로그인한 계정, 로그아웃(일반 form POST 라 JS 없이도 된다)
export async function AdminShell({
  email,
  needsScript = false,
  children,
}: {
  email: string;
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
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-x-5 gap-y-2.5 border-b border-dark-12 page-x py-5">
        <Link
          href="/admin"
          className="mr-auto text-label text-grey-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-70"
        >
          {layout("brand")} <span className="text-grey-50">{t("label")}</span>
        </Link>
        <p className="text-body text-grey-50">{t("signedInAs", { email })}</p>
        <form action={signOutAction}>
          <button
            type="submit"
            className={buttonStyles({ variant: "outline" })}
          >
            {t("signOut")}
          </button>
        </form>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col page-x pt-10 pb-20 lg:pt-15">
        {needsScript && (
          <noscript>
            <p className="mb-10 rounded-10 border border-purple-70 px-5 py-4 text-body text-grey-90">
              {works("editor.noscript")}
            </p>
          </noscript>
        )}
        {children}
      </main>
    </div>
  );
}
