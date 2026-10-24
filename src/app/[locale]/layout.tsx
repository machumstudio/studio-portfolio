import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { manrope } from "@/lib/fonts";
import { siteMetadata } from "@/lib/seo/metadata";
import { isIndexable, readSiteUrl } from "@/lib/seo/site";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  // 절대 주소 기준과 미리보기 noindex. canonical/OG 는 페이지마다 (src/lib/seo/metadata.ts pageMetadata).
  // 제목/설명은 metadata 를 따로 정하지 않은 화면(개발용 /tokens)의 기본값
  return {
    ...siteMetadata({ siteUrl: readSiteUrl(), indexable: isIndexable() }),
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={manrope.variable}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
