import type { Work, WorkCategory } from "@/domain/works/work";
import type { WorkRepository } from "./work-repository";

export type GetPublishedWorksOptions = {
  category?: WorkCategory;
  /** 최신순으로 앞에서 몇 개까지 (없으면 전부) */
  limit?: number;
};

// 촬영 연월 내림차순. 같은 달이면 slug 순으로 고정해 저장소마다 순서가 달라지지 않게 한다
export const newestFirst = (a: Work, b: Work) =>
  b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug);

// 공개 작업 목록 (홈 미리보기, Portfolio 갤러리)
export const getPublishedWorks =
  ({ repo }: { repo: WorkRepository }) =>
  async ({ category, limit }: GetPublishedWorksOptions = {}): Promise<Work[]> =>
    (await repo.findAll())
      .filter(
        (work) => work.published && (!category || work.category === category),
      )
      .sort(newestFirst)
      .slice(0, limit);
