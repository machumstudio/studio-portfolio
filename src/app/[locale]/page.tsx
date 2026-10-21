import { use } from "react";
import { setRequestLocale } from "next-intl/server";
import { TokenSheet } from "./token-sheet";

// 임시 토큰 확인 페이지. 2번 이후 Home 섹션으로 교체한다.
export default function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return <TokenSheet />;
}
