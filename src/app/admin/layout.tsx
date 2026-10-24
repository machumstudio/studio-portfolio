import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { manrope } from "@/lib/fonts";
import "../globals.css";

// 관리자 화면의 루트 레이아웃 (docs/adr/0013). 공개 사이트([locale])와 따로 html/body 를 갖는다.
// - 한국어만: /admin 에는 언어 접두사가 없고 proxy 가 next-intl 을 거치지 않는다. 메시지는 ko
// - 검색 제외: robots noindex/nofollow (proxy 가 X-Robots-Tag 도 붙인다)
// - instant = false: 모든 화면이 요청 쿠키(세션)를 읽으므로 정적 껍데기 없이 서버에서 다 그려서 보낸다.
//   Suspense 로 나누지 않아 JS 없이도 로그인 결과 화면이 그대로 보인다
export const instant = false;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  setRequestLocale("ko");
  return (
    <html lang="ko" className={manrope.variable}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
