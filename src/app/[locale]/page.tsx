import { use } from "react";
import { setRequestLocale } from "next-intl/server";
import { SiteCta } from "@/components/sections/SiteCta";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { getCopyrightYear } from "@/lib/copyright-year";
import { TokenSheet } from "./token-sheet";

// 본문은 아직 임시 토큰 확인 페이지. 06칸부터 Home 섹션으로 교체한다.
export default function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return (
    <>
      <SiteHeader />
      <TokenSheet />
      <SiteFooter cta={<SiteCta />} year={use(getCopyrightYear())} />
    </>
  );
}
