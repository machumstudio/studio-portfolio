import type { NextConfig } from "next";
import { routing } from "../../i18n/routing";
import { localizedPath } from "./alternates";

type Redirect = Awaited<
  ReturnType<NonNullable<NextConfig["redirects"]>>
>[number];

// 예전 사이트 주소 → 지금 주소 (301 영구 이동). "기존 사이트에서 옮겨 왔다"는 가정의 예시 목록이다.
// 운영자가 주소를 더할 때는 이 목록에 한 줄씩 넣는다:
//   - from: 예전 경로, to: 지금 경로. 둘 다 언어 접두사 없이 쓴다 (ko 는 접두사 없음, en 은 /en 이 자동으로 붙는다)
//   - 바뀌는 부분은 :이름 (예: /gallery/:slug → /work/:slug). 같은 이름이 to 에 그대로 들어간다
//   - to 는 지금 있는 페이지여야 하고, 다른 규칙의 from 이 되면 안 된다 (한 번에 도착, 고리 없음).
//     legacy-redirects.test.ts 가 이 두 가지를 검사한다
// 예전 사이트의 작업 상세는 /gallery/<slug> 였다고 가정한다. 지금은 목록이 /portfolio, 상세가 /work/<slug> 다
export const legacyRedirects: readonly { from: string; to: string }[] = [
  { from: "/gallery", to: "/portfolio" },
  { from: "/gallery/:slug", to: "/work/:slug" },
  { from: "/about-us", to: "/about" },
  { from: "/pricing", to: "/services" },
  { from: "/contact-us", to: "/contact" },
  { from: "/index.html", to: "/" },
];

/**
 * next.config redirects 로 펼친다. Next 의 permanent: true 는 308 이라, 공고와 검색엔진 안내에서
 * 말하는 301 을 statusCode 로 직접 준다 (예전 주소는 GET 링크라 메서드 보존이 필요 없다).
 * 언어마다 한 줄: ko 는 /about-us 와 예전 사이트가 썼을 수 있는 /ko/about-us 둘 다 → /about,
 * en 은 /en/about-us → /en/about. /ko/... 를 따로 두는 것은 next-intl 의 /ko → / 이동을 한 번 더 거치지 않게
 */
export function toNextRedirects(
  rules: readonly { from: string; to: string }[] = legacyRedirects,
): Redirect[] {
  return rules.flatMap(({ from, to }) =>
    routing.locales.flatMap((locale) => {
      const destination = localizedPath(locale, to);
      const sources =
        locale === routing.defaultLocale
          ? [from, `/${locale}${from}`]
          : [localizedPath(locale, from)];
      return sources.map((source) => ({
        source,
        destination,
        statusCode: 301,
      }));
    }),
  );
}
