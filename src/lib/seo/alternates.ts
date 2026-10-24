import { routing } from "../../i18n/routing";

// 언어별 주소. ko 는 접두사 없이(/about), en 은 /en/about (src/i18n/routing.ts localePrefix "as-needed")
export type Locale = (typeof routing.locales)[number];

/** path 는 언어 접두사 없는 사이트 경로 ("/", "/about", "/work/slug") */
export function localizedPath(locale: Locale, path: string): string {
  if (locale === routing.defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/**
 * hreflang 대체 주소: 언어마다 하나 + x-default(언어를 고르지 않은 사람에게 보여 줄 주소 = 기본 언어 ko).
 * metadata alternates.languages 와 sitemap alternates.languages 가 같이 쓴다
 */
export function languageAlternates(
  path: string,
  toUrl: (path: string) => string = (p) => p,
): Record<string, string> {
  return {
    ...Object.fromEntries(
      routing.locales.map((locale) => [
        locale,
        toUrl(localizedPath(locale, path)),
      ]),
    ),
    "x-default": toUrl(localizedPath(routing.defaultLocale, path)),
  };
}
