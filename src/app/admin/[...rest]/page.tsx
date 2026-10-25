import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({
    locale: "ko",
    namespace: "AdminErrors.notFound",
  });
  return { title: t("metadata") };
}

// /admin 아래 어떤 경로에도 맞지 않는 주소. 그냥 두면 Next 기본 404(영어, 관리자 틀 없음)가 나온다.
// 여기서 notFound() 를 불러 ../not-found.tsx 를 보여 준다. 요청 값을 읽지 않아 빌드 때 404 화면으로 만들어진다
export default function AdminCatchAll() {
  notFound();
}
