import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ko", "en"],
  defaultLocale: "ko",
  // ko 는 접두사 없이(/), en 은 /en
  localePrefix: "as-needed",
  // 브라우저 언어로 리다이렉트하지 않는다. / 는 항상 ko (시각 비교도 같은 화면을 보게)
  localeDetection: false,
});
