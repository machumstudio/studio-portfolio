import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/seo/alternates";
import { pageMetadata, type PageSeo } from "@/lib/seo/metadata";

// 공개 페이지의 generateMetadata 가 부르는 입구. 기본 공유 카드의 alt 를 메시지에서 채운다
export async function sitePageMetadata(
  seo: Omit<PageSeo, "locale"> & { locale: string },
): Promise<Metadata> {
  // locale 은 [locale] layout 에서 hasLocale 로 확인한 값
  const locale = seo.locale as Locale;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return pageMetadata({ ...seo, locale }, t("ogImageAlt"));
}

/** 메시지의 <namespace>.title / .description 을 쓰는 고정 페이지 */
export async function staticPageMetadata(
  locale: string,
  path: string,
  namespace: string,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace });
  return sitePageMetadata({
    locale,
    path,
    title: t("title"),
    description: t("description"),
  });
}
