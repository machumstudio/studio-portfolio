import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonStyles } from "@/components/ui/Button";

// 없는 작업(이미 지움, 잘못된 주소)의 404. 관리자 루트 레이아웃 안에서 그린다
export default async function AdminWorkNotFound() {
  const t = await getTranslations({ locale: "ko", namespace: "AdminWorks" });
  return (
    <main className="grid min-h-dvh place-items-center page-x py-20">
      <div className="flex max-w-md flex-col items-start gap-5">
        <h1 className="text-h3 text-white">{t("notFound.title")}</h1>
        <p className="text-body text-grey-70">{t("notFound.body")}</p>
        <Link href="/admin" className={buttonStyles({ variant: "outline" })}>
          {t("editor.back")}
        </Link>
      </div>
    </main>
  );
}
