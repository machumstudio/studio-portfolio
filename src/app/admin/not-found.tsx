import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonStyles } from "@/components/ui/Button";
import { adminInquiriesPath } from "@/features/inquiry/admin-view";

// 없는 관리자 화면(/admin/없는-주소)의 404. 관리자 루트 레이아웃 안에서 한국어로 그린다.
// 없는 작업과 문의는 각자의 not-found 가 있다 (works/, inquiries/)
export default async function AdminNotFound() {
  const t = await getTranslations({
    locale: "ko",
    namespace: "AdminErrors.notFound",
  });
  return (
    <main className="grid min-h-dvh place-items-center page-x py-20">
      <div className="flex max-w-md flex-col items-start gap-5">
        <h1 className="text-h3 text-white">{t("title")}</h1>
        <p className="text-body text-grey-70">{t("body")}</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/admin" className={buttonStyles({ variant: "outline" })}>
            {t("works")}
          </Link>
          <Link
            href={adminInquiriesPath}
            className={buttonStyles({ variant: "outline" })}
          >
            {t("inquiries")}
          </Link>
        </div>
      </div>
    </main>
  );
}
