import { describe, expect, it } from "vitest";
import { languageAlternates, localizedPath } from "./alternates";
import { pageMetadata, siteMetadata } from "./metadata";
import { isIndexable, readSiteUrl } from "./site";

describe("readSiteUrl", () => {
  it("NEXT_PUBLIC_SITE_URL 이 먼저다. 끝의 / 와 경로는 뗀다", () => {
    expect(
      readSiteUrl({
        NEXT_PUBLIC_SITE_URL: " https://machum.example/ ",
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "machum.vercel.app",
        VERCEL_URL: "preview-1.vercel.app",
      }),
    ).toBe("https://machum.example");
  });

  it("Vercel 운영 배포는 프로젝트 운영 도메인 (프로토콜 없이 오는 값)", () => {
    expect(
      readSiteUrl({
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "machum.vercel.app",
        VERCEL_URL: "machum-abc123.vercel.app",
      }),
    ).toBe("https://machum.vercel.app");
  });

  it("Vercel 미리보기는 그 배포 주소", () => {
    expect(
      readSiteUrl({
        VERCEL_ENV: "preview",
        VERCEL_PROJECT_PRODUCTION_URL: "machum.vercel.app",
        VERCEL_URL: "machum-git-slot-20.vercel.app",
      }),
    ).toBe("https://machum-git-slot-20.vercel.app");
  });

  it("아무것도 없으면 (빈 문자열 포함) 로컬", () => {
    expect(readSiteUrl({})).toBe("http://localhost:3000");
    expect(readSiteUrl({ NEXT_PUBLIC_SITE_URL: "" })).toBe(
      "http://localhost:3000",
    );
    expect(readSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://localhost:3100" })).toBe(
      "http://localhost:3100",
    );
  });
});

describe("isIndexable", () => {
  it.each([
    [{ VERCEL_ENV: "production" }, true],
    [{ VERCEL_ENV: "preview" }, false],
    [{ VERCEL_ENV: "development" }, false],
    [{}, false],
  ])("%j → %s", (env, expected) => {
    expect(isIndexable(env)).toBe(expected);
  });
});

describe("localizedPath / languageAlternates", () => {
  it("ko 는 접두사 없이, en 은 /en", () => {
    expect(localizedPath("ko", "/")).toBe("/");
    expect(localizedPath("en", "/")).toBe("/en");
    expect(localizedPath("ko", "/work/a-b")).toBe("/work/a-b");
    expect(localizedPath("en", "/work/a-b")).toBe("/en/work/a-b");
  });

  it("언어마다 하나 + x-default 는 ko 주소", () => {
    expect(languageAlternates("/about")).toEqual({
      ko: "/about",
      en: "/en/about",
      "x-default": "/about",
    });
    expect(
      languageAlternates("/", (path) => `https://machum.example${path}`),
    ).toEqual({
      ko: "https://machum.example/",
      en: "https://machum.example/en",
      "x-default": "https://machum.example/",
    });
  });
});

describe("pageMetadata", () => {
  const seo = {
    path: "/about",
    title: "About | Machum Studio",
    description: "Story",
  };

  it("canonical 은 지금 언어의 주소, hreflang 은 두 언어 + x-default", () => {
    const metadata = pageMetadata({ ...seo, locale: "en" }, "Card");
    expect(metadata.alternates).toEqual({
      canonical: "/en/about",
      languages: { ko: "/about", en: "/en/about", "x-default": "/about" },
    });
  });

  it("OG 와 X 카드: 제목/설명/주소/언어, 이미지가 없으면 언어별 기본 카드 1200x630", () => {
    const metadata = pageMetadata({ ...seo, locale: "ko" }, "스튜디오 카드");
    expect(metadata.openGraph).toEqual({
      type: "website",
      siteName: "Machum Studio",
      locale: "ko_KR",
      alternateLocale: ["en_US"],
      url: "/about",
      title: seo.title,
      description: seo.description,
      images: [
        {
          url: "/og/machum-studio-ko.jpg",
          alt: "스튜디오 카드",
          width: 1200,
          height: 630,
        },
      ],
    });
    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [{ url: "/og/machum-studio-ko.jpg", alt: "스튜디오 카드" }],
    });
  });

  it("작업 상세: article, 대표 사진이 카드 이미지", () => {
    const image = { url: "https://cdn.example/w/1.jpg", alt: "반지" };
    const metadata = pageMetadata(
      {
        ...seo,
        locale: "ko",
        path: "/work/a-wedding-tale",
        type: "article",
        image,
      },
      "카드",
    );
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      url: "/work/a-wedding-tale",
      images: [image],
    });
    expect(metadata.twitter).toMatchObject({ images: [image] });
  });
});

describe("siteMetadata", () => {
  it("운영: metadataBase 만, robots 는 페이지 기본값(색인 허용)", () => {
    const metadata = siteMetadata({
      siteUrl: "https://machum.example",
      indexable: true,
    });
    expect(String(metadata.metadataBase)).toBe("https://machum.example/");
    expect(metadata.robots).toBeUndefined();
  });

  it("운영이 아니면 noindex, nofollow", () => {
    expect(
      siteMetadata({ siteUrl: "http://localhost:3000", indexable: false })
        .robots,
    ).toEqual({ index: false, follow: false });
  });
});
