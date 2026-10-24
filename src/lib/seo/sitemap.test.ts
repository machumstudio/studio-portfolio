import { describe, expect, it } from "vitest";
import { buildRobots, buildSitemap } from "./sitemap";

const siteUrl = "https://machum.example";
const older = new Date("2026-10-01T00:00:00Z");
const newer = new Date("2026-10-20T09:30:00Z");

describe("buildSitemap", () => {
  const sitemap = buildSitemap({
    siteUrl,
    works: [
      { slug: "a-wedding-tale", updatedAt: older },
      { slug: "product-elegance", updatedAt: newer },
    ],
  });
  const entry = (url: string) => sitemap.find((item) => item.url === url);

  it("고정 페이지 5개와 공개 작업이 언어마다 한 줄씩", () => {
    expect(sitemap.map(({ url }) => url)).toEqual([
      `${siteUrl}/`,
      `${siteUrl}/en`,
      `${siteUrl}/portfolio`,
      `${siteUrl}/en/portfolio`,
      `${siteUrl}/about`,
      `${siteUrl}/en/about`,
      `${siteUrl}/services`,
      `${siteUrl}/en/services`,
      `${siteUrl}/contact`,
      `${siteUrl}/en/contact`,
      `${siteUrl}/work/a-wedding-tale`,
      `${siteUrl}/en/work/a-wedding-tale`,
      `${siteUrl}/work/product-elegance`,
      `${siteUrl}/en/work/product-elegance`,
    ]);
  });

  it("각 줄에 ko/en 과 x-default 대체 주소 (절대 주소)", () => {
    const languages = {
      ko: `${siteUrl}/work/a-wedding-tale`,
      en: `${siteUrl}/en/work/a-wedding-tale`,
      "x-default": `${siteUrl}/work/a-wedding-tale`,
    };
    expect(entry(languages.ko)?.alternates).toEqual({ languages });
    expect(entry(languages.en)?.alternates).toEqual({ languages });
    expect(entry(`${siteUrl}/en`)?.alternates?.languages).toEqual({
      ko: `${siteUrl}/`,
      en: `${siteUrl}/en`,
      "x-default": `${siteUrl}/`,
    });
  });

  it("작업의 lastmod 는 그 작업의 수정 시각, 홈과 포트폴리오는 가장 최근 수정 시각", () => {
    expect(entry(`${siteUrl}/work/a-wedding-tale`)?.lastModified).toEqual(
      older,
    );
    expect(entry(`${siteUrl}/en/work/product-elegance`)?.lastModified).toEqual(
      newer,
    );
    expect(entry(`${siteUrl}/`)?.lastModified).toEqual(newer);
    expect(entry(`${siteUrl}/en/portfolio`)?.lastModified).toEqual(newer);
  });

  it("고정 페이지(소개/서비스/문의)는 lastmod 를 지어내지 않는다", () => {
    expect(entry(`${siteUrl}/about`)).not.toHaveProperty("lastModified");
    expect(entry(`${siteUrl}/en/contact`)).not.toHaveProperty("lastModified");
  });

  it("공개 작업이 없으면 고정 페이지만, 홈도 lastmod 없음", () => {
    const empty = buildSitemap({ siteUrl, works: [] });
    expect(empty).toHaveLength(10);
    expect(empty[0]).not.toHaveProperty("lastModified");
  });
});

describe("buildRobots", () => {
  it("모두 허용, /admin 만 막고 sitemap 주소를 알린다", () => {
    expect(buildRobots(siteUrl)).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: "/admin" },
      sitemap: `${siteUrl}/sitemap.xml`,
    });
  });
});
