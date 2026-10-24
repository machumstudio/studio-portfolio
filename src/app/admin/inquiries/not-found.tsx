import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonStyles } from "@/components/ui/Button";
import { adminInquiriesPath } from "@/features/inquiry/admin-view";

// 없는 문의(이미 지움, 잘못된 주소)의 404. 관리자 루트 레이아웃 안에서 그린다
export default async function AdminInquiryNotFound() {
  const t = await getTranslations({
    locale: "ko",
    namespace: "AdminInquiries",
  });
  return (
    <main className="grid min-h-dvh place-items-center page-x py-20">
      <div className="flex max-w-md flex-col items-start gap-5">
        <h1 className="text-h3 text-white">{t("notFound.title")}</h1>
        <p className="text-body text-grey-70">{t("notFound.body")}</p>
        <Link
          href={adminInquiriesPath}
          className={buttonStyles({ variant: "outline" })}
        >
          {t("detail.back")}
        </Link>
      </div>
    </main>
  );
}
