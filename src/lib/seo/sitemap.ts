import type { MetadataRoute } from "next";
import { routing } from "../../i18n/routing";
import { languageAlternates, localizedPath } from "./alternates";

/** sitemap 에 넣을 공개 작업. 비공개 작업은 넘기지 않는다 (공개 목록 유스케이스가 거른다) */
export type SitemapWork = { slug: string; updatedAt: Date };

// 검색에 내보낼 고정 페이지 (언어 접두사 없는 경로). 관리자, 개발용 /tokens, 404 는 넣지 않는다.
// 작업 목록이 보이는 홈과 포트폴리오는 가장 최근에 고친 작업의 시각을 lastmod 로 쓴다
const pages = [
  { path: "/", listsWorks: true },
  { path: "/portfolio", listsWorks: true },
  { path: "/about", listsWorks: false },
  { path: "/services", listsWorks: false },
  { path: "/contact", listsWorks: false },
] as const;

/**
 * 언어마다 한 줄씩(ko, en) + 각 줄에 모든 언어의 대체 주소(hreflang, x-default).
 * 고정 페이지의 lastmod 는 문구를 고친 시각을 알 수 없어 비운다 (모르는 값을 지어내지 않는다).
 * changefreq/priority 는 Google 이 읽지 않아 넣지 않는다
 */
export function buildSitemap({
  siteUrl,
  works,
}: {
  siteUrl: string;
  works: readonly SitemapWork[];
}): MetadataRoute.Sitemap {
  const absolute = (path: string) => `${siteUrl}${path}`;
  const latest = works.reduce<Date | undefined>(
    (max, { updatedAt }) => (!max || updatedAt > max ? updatedAt : max),
    undefined,
  );
  const entries = [
    ...pages.map(({ path, listsWorks }) => ({
      path,
      lastModified: listsWorks ? latest : undefined,
    })),
    ...works.map(({ slug, updatedAt }) => ({
      path: `/work/${slug}`,
      lastModified: updatedAt,
    })),
  ];
  return entries.flatMap(({ path, lastModified }) =>
    routing.locales.map((locale) => ({
      url: absolute(localizedPath(locale, path)),
      ...(lastModified ? { lastModified } : {}),
      alternates: { languages: languageAlternates(path, absolute) },
    })),
  );
}

/** robots.txt: 관리자는 막고 sitemap 주소를 알린다. 운영 여부와 상관없이 같다 (아래 이유) */
export function buildRobots(siteUrl: string): MetadataRoute.Robots {
  // 미리보기 배포도 크롤링은 막지 않는다. robots.txt 로 막으면 검색엔진이 페이지의 noindex 를 읽지 못해
  // 다른 곳의 링크만으로 주소가 색인될 수 있다. 미리보기는 noindex 메타 태그와 X-Robots-Tag 헤더가 막는다
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
