import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { use } from "react";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { WorkDetail } from "@/components/sections/WorkDetail";
import { WorkPager } from "@/components/sections/WorkPager";
import type { LocalizedText } from "@/domain/works/localized-text";
import type { Work } from "@/domain/works/work";
import {
  getAdjacentWorks,
  getPublishedWorks,
  getWorkBySlug,
} from "@/features/works/queries";
import { formatYearMonth } from "@/i18n/use-year-month-format";
import type { Locale } from "@/lib/seo/alternates";
import { JsonLd } from "@/lib/seo/json-ld";
import { readSiteUrl } from "@/lib/seo/site";
import { workJsonLd } from "@/lib/seo/structured-data";
import { sitePageMetadata } from "../../_seo/page-metadata";

// 공개 작업은 빌드 때 미리 만든다 (locale 은 상위 layout 의 generateStaticParams 가 채운다).
// 목록에 없는 slug(없는/비공개 작업)는 notFound() → (site)/not-found.tsx.
// 'navigation': 목록에 없는 slug 도 App Shell 을 먼저 흘려보내지 않고 완성된 결과를 기다린다.
// 그래야 notFound() 가 스트리밍 전에 일어나 상태 코드가 200(soft 404)이 아니라 404 가 된다
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return (await getPublishedWorks()).map(({ slug }) => ({ slug }));
}

// 검색/공유에 쓰는 작업 문구: 제목, 설명("2021년 9월 이벤트 촬영 · …"), 분야 이름.
// metadata 와 구조화 데이터가 같은 문구를 쓴다
async function workText(locale: string, { title, category, date }: Work) {
  // locale 은 layout 에서 hasLocale 로 확인한 값
  const lang = locale as keyof LocalizedText;
  const t = await getTranslations({ locale, namespace: "WorkPage.metadata" });
  const categories = await getTranslations({
    locale,
    namespace: "Works.categories",
  });
  const genre = categories(`${category}.name`);
  return {
    title: t("title", { title: title[lang] }),
    description: t("description", {
      title: title[lang],
      category: genre,
      date: formatYearMonth(await getFormatter({ locale }), date),
    }),
    genre,
  };
}

// 제목, 설명, canonical/hreflang, OG/X 카드 이미지(대표 사진). 없는/비공개 작업은 not-found.tsx 가 제목을 정한다
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/work/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const result = await getWorkBySlug(slug);
  if (!result.ok) return {};
  const work = result.value;
  const { title, description } = await workText(locale, work);
  return sitePageMetadata({
    locale,
    path: `/work/${work.slug}`,
    type: "article",
    title,
    description,
    image: {
      url: work.cover.src,
      alt: work.cover.alt[locale as keyof LocalizedText],
    },
  });
}

// 간격: 헤더-본문 40/80/100 (Portfolio 히어로와 같음), 본문-이전/다음 80/100/150 (히어로 띠-갤러리와 같음)
export default function WorkPage({
  params,
}: PageProps<"/[locale]/work/[slug]">) {
  const { locale, slug } = use(params);
  setRequestLocale(locale);
  const result = use(getWorkBySlug(slug));
  if (!result.ok) notFound();
  const { previous, next } = use(getAdjacentWorks(slug));
  // locale 은 layout 에서 hasLocale 로 확인한 값
  const lang = locale as keyof LocalizedText;
  const { title, category, date, cover, images } = result.value;
  const text = use(workText(locale, result.value));
  const photo = ({ src, alt }: typeof cover) => ({ src, alt: alt[lang] });
  const pagerItem = (work: typeof previous) =>
    work && { slug: work.slug, title: work.title[lang] };

  return (
    <main className="flex flex-col gap-20 pt-10 pb-20 lg:gap-25 lg:pt-20 lg:pb-37.5 3xl:gap-37.5 3xl:pt-25 3xl:pb-50">
      <WorkDetail
        title={title[lang]}
        category={category}
        date={date}
        cover={photo(cover)}
        images={images.map(photo)}
      />
      <WorkPager previous={pagerItem(previous)} next={pagerItem(next)} />
      <JsonLd
        data={workJsonLd({
          siteUrl: readSiteUrl(),
          locale: locale as Locale,
          slug: result.value.slug,
          title: title[lang],
          description: text.description,
          date,
          genre: text.genre,
          images: [
            cover,
            ...images.filter(({ order }) => order !== cover.order),
          ].map(({ src }) => src),
        })}
      />
    </main>
  );
}
