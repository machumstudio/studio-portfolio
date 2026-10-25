import type { Metadata } from "next";
import { use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { AboutBiography } from "@/components/sections/AboutBiography";
import { AboutHero } from "@/components/sections/AboutHero";
import { AboutTimeline } from "@/components/sections/AboutTimeline";
import { pagePhotos } from "../_sections/photos";
import { Testimonials } from "../_sections/site-sections";
import { staticPageMetadata } from "../_seo/page-metadata";

// 통계, 이야기, 연표는 메시지로 만든 고정값을 섹션 props 로 넘긴다
const statIds = [
  "years",
  "clients",
  "awards",
  "abroad",
  "followers",
  "retention",
] as const;
const paragraphIds = ["origin", "craft", "promise"] as const;
const years = [2005, 2010, 2012, 2015, 2017, 2020] as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  return staticPageMetadata(locale, "/about", "AboutPage.metadata");
}

// 시안 간격(about-*.json, 노드 h 합과 프레임 높이 차이): 헤더-소개 40/80/100,
// 소개-이야기 60/80/100 (같은 Container 의 gap), 이후 섹션 80/150/200
export default function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("AboutPage");
  const photo = useTranslations("Photos");

  return (
    <div className="flex flex-col gap-20 pt-10 pb-20 lg:gap-37.5 lg:pt-20 lg:pb-37.5 3xl:gap-50 3xl:pt-25 3xl:pb-50">
      <div className="flex flex-col gap-15 lg:gap-20 3xl:gap-25">
        <AboutHero
          image={{ src: pagePhotos.aboutHero, alt: photo("aboutHero") }}
          stats={statIds.map((id) => ({
            id,
            value: t(`stats.items.${id}.value`),
            label: t(`stats.items.${id}.label`),
          }))}
        />
        <AboutBiography
          paragraphs={paragraphIds.map((id) => t(`biography.paragraphs.${id}`))}
        />
      </div>
      <AboutTimeline
        items={years.map((year) => ({
          year,
          body: t(`timeline.items.${year}`),
        }))}
      />
      <Testimonials />
    </div>
  );
}
