import type { MetadataRoute } from "next";
import { getPublishedWorks } from "@/features/works/queries";
import { buildSitemap } from "@/lib/seo/sitemap";
import { readSiteUrl } from "@/lib/seo/site";

// /sitemap.xml: 공개 페이지 + 공개 작업 (ko/en). 작업 읽기는 "works" 캐시 태그를 달고 있어서,
// 관리자가 작업을 저장/공개 전환/삭제하면 updateTag("works") 로 이 파일도 다시 만들어진다
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const works = await getPublishedWorks();
  return buildSitemap({
    siteUrl: readSiteUrl(),
    works: works.map(({ slug, updatedAt }) => ({ slug, updatedAt })),
  });
}
