import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buttonStyles } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { signOutAction } from "@/features/admin-auth/actions";
import { requireAdmin } from "@/features/admin-auth/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({
    locale: "ko",
    namespace: "AdminDashboard",
  });
  return { title: t("metadata") };
}

// /admin 대시보드 자리. 18칸(작업 관리), 19칸(문의 관리)이 들어온다.
// proxy 를 지나왔어도 여기서 인증 서버에 세션을 다시 확인한다 (requireAdmin).
// 로그아웃은 일반 form POST 라 JS 없이도 된다
export default async function AdminDashboardPage() {
  const admin = await requireAdmin("/admin");
  const t = await getTranslations({
    locale: "ko",
    namespace: "AdminDashboard",
  });
  const layout = await getTranslations({ locale: "ko", namespace: "Layout" });

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-5 border-b border-dark-12 page-x py-5">
        <p className="text-label text-grey-90">{layout("brand")}</p>
        <form action={signOutAction}>
          <button
            type="submit"
            className={buttonStyles({ variant: "outline" })}
          >
            {t("signOut")}
          </button>
        </form>
      </header>
      <main className="flex flex-col gap-6 page-x pt-10 pb-20 lg:pt-20">
        <SectionHeading as="h1" eyebrow={t("label")} title={t("title")} />
        <p className="text-body text-grey-70">
          {t("signedInAs", { email: admin.email })}
        </p>
        <p className="text-body text-grey-50">{t("empty")}</p>
      </main>
    </div>
  );
}
