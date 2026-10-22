import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { TokenSheet } from "./token-sheet";

// 개발용 토큰 확인 화면. 공개 사이트 틀((site) 그룹) 밖에 두고 네비게이션에 넣지 않는다 (docs/adr/0006)
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function TokensPage({ params }: PageProps<"/[locale]/tokens">) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <main>
      <TokenSheet />
    </main>
  );
}
