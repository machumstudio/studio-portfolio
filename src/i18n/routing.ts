import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ko", "en"],
  defaultLocale: "ko",
  // ko 는 접두사 없이(/), en 은 /en
  localePrefix: "as-needed",
  // 브라우저 언어로 리다이렉트하지 않는다. / 는 항상 ko (시각 비교도 같은 화면을 보게)
  localeDetection: false,
  // hreflang 은 페이지 metadata(src/lib/seo/metadata.ts)와 sitemap 이 맡는다. next-intl 의 Link 응답 헤더는
  // 요청 호스트로 만들어져 canonical 주소와 어긋나고 404 화면에도 붙어서 끈다
  alternateLinks: false,
});
