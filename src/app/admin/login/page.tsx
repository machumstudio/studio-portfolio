import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { signInAction } from "@/features/admin-auth/actions";
import { AdminLoginForm } from "@/features/admin-auth/ui/AdminLoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "ko", namespace: "AdminLogin" });
  return { title: t("metadata") };
}

// /admin/login. proxy 가 보호하지 않는 유일한 관리자 화면.
// 요청 값(쿠키, searchParams)을 하나도 읽지 않는 완전 정적 화면으로 둔다. 동적인 부분이 하나라도 있으면
// JS 없는 제출 뒤 실패 결과가 다시 그려지지 않는다 (docs/adr/0013). 그래서 돌아갈 곳(?next=)은 proxy 가 검사해서
// 쿠키로 넘기고 로그인 액션이 읽는다. 이미 로그인한 관리자도 이 화면을 보며, 다시 로그인하면 된다
// 시안에 없는 화면: 가운데 카드 하나(surface-raised, radius 10, pad 30/40) + 브랜드, 제목(h1), 설명, 폼
export default async function AdminLoginPage() {
  const t = await getTranslations({ locale: "ko", namespace: "AdminLogin" });
  const layout = await getTranslations({ locale: "ko", namespace: "Layout" });

  return (
    <main className="grid min-h-dvh place-items-center page-x py-20">
      <div className="flex w-full max-w-md flex-col gap-7.5 rounded-10 p-7.5 surface-raised lg:p-10">
        <div className="flex flex-col gap-2.5">
          <p className="text-label text-grey-50">{layout("brand")}</p>
          <h1 className="text-h3 text-white">{t("title")}</h1>
          <p className="text-body text-grey-70">{t("description")}</p>
        </div>
        <AdminLoginForm action={signInAction} />
      </div>
    </main>
  );
}
