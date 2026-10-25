import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "ko", namespace: "AdminWorks" });
  return { title: t("notFound.metadata") };
}

// 없는 작업의 404 화면 (../../not-found.tsx). proxy 가 없는 작업 편집 주소를 여기로 rewrite 한다 (docs/adr/0019).
// 요청 값을 읽지 않고 바로 notFound() 라서 빌드 때 상태 코드 404 화면으로 만들어진다
export default function MissingWork() {
  notFound();
}
