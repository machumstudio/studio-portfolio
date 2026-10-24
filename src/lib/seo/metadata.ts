import type { Metadata } from "next";
import { routing } from "../../i18n/routing";
import { languageAlternates, localizedPath, type Locale } from "./alternates";

export type SeoImage = {
  /** 사이트 경로(/images/...) 또는 절대 주소(Storage). 상대 경로는 metadataBase 로 절대 주소가 된다 */
  url: string;
  alt: string;
  width?: number;
  height?: number;
};

export type PageSeo = {
  locale: Locale;
  /** 언어 접두사 없는 경로 ("/", "/about", "/work/slug") */
  path: string;
  title: string;
  description: string;
  /** 없으면 스튜디오 기본 카드 (public/og, 1200x630) */
  image?: SeoImage;
  type?: "website" | "article";
};

const ogLocales: Record<Locale, string> = { ko: "ko_KR", en: "en_US" };

export const siteName = "Machum Studio";

/** 공유 카드 기본 이미지. scripts/og-image.mts 로 만든다 (글자를 그림으로 넣어 받는 쪽 글꼴과 상관없다) */
export const defaultOgImage = (locale: Locale, alt: string): SeoImage => ({
  url: `/og/machum-studio-${locale}.jpg`,
  alt,
  width: 1200,
  height: 630,
});

/**
 * 공개 페이지 하나의 metadata: 제목/설명, canonical(지금 언어 주소), hreflang(ko/en + x-default),
 * Open Graph, X(Twitter) 카드. Next 는 openGraph/twitter 를 상위와 합치지 않고 통째로 바꾸므로
 * 페이지마다 이 함수로 전부 채운다 (layout 에는 metadataBase 와 robots 만 둔다)
 */
export function pageMetadata(
  { locale, path, title, description, image, type = "website" }: PageSeo,
  defaultImageAlt: string,
): Metadata {
  const url = localizedPath(locale, path);
  const card = image ?? defaultOgImage(locale, defaultImageAlt);
  return {
    title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type,
      siteName,
      locale: ogLocales[locale],
      alternateLocale: routing.locales
        .filter((other) => other !== locale)
        .map((other) => ogLocales[other]),
      url,
      title,
      description,
      images: [card],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: card.url, alt: card.alt }],
    },
  };
}

/** [locale] 레이아웃의 metadata. 절대 주소 기준과, 운영이 아닐 때 모든 화면의 noindex */
export function siteMetadata({
  siteUrl,
  indexable,
}: {
  siteUrl: string;
  indexable: boolean;
}): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    applicationName: siteName,
    ...(indexable ? {} : { robots: { index: false, follow: false } }),
  };
}
