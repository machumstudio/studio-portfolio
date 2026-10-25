import { use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { SiteCta } from "@/components/sections/SiteCta";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { SkipLink } from "@/components/ui/SkipLink";
import { getCopyrightYear } from "@/lib/copyright-year";

// 공개 사이트 공통 틀: 헤더 + 페이지 + CTA 가 든 푸터 (docs/adr/0006).
// (site) 는 URL 에 나타나지 않는 라우트 그룹이다. 관리자(/admin)는 나중에 다른 그룹이 된다.
export default function SiteLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations("Layout");

  // 본문 틀 <main id="main">(건너뛰기 링크가 가는 곳)은 여기 한 곳에 둔다. 페이지(404, 오류 포함)는 그 안의 내용만 그린다.
  // 페이지마다 두면 화면 안 이동 뒤 Next(cacheComponents)가 숨겨 둔 이전 페이지(최대 3개)와 함께 id 가 여러 개가 된다
  return (
    <>
      <SkipLink>{t("skipToContent")}</SkipLink>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter cta={<SiteCta />} year={use(getCopyrightYear())} />
    </>
  );
}
