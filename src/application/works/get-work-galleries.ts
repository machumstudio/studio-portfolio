import {
  workCategories,
  type Work,
  type WorkCategory,
} from "@/domain/works/work";
import { getPublishedWorks } from "./get-published-works";
import type { WorkRepository } from "./work-repository";

export type WorkGallery = { category: WorkCategory; works: Work[] };

export type WorkGalleries = {
  /** 필터에 보일 카테고리 전체 (갤러리 순서) */
  categories: readonly WorkCategory[];
  /** 주소에서 고른 카테고리. 없거나 모르는 값이면 null (전체) */
  selected: WorkCategory | null;
  /** 카테고리 순서(인물, 이벤트, 광고)대로, 각 묶음은 최신순 */
  galleries: WorkGallery[];
};

// Portfolio 페이지 갤러리. 주소의 ?category= 값을 그대로 받는다:
// 아는 카테고리면 그 묶음 하나만, 없거나 모르는 값이면 전체 (공유된 옛 주소가 404 가 되지 않게)
export const getWorkGalleries =
  ({ repo }: { repo: WorkRepository }) =>
  async (category?: string): Promise<WorkGalleries> => {
    const selected = workCategories.find((c) => c === category) ?? null;
    const published = getPublishedWorks({ repo });
    const galleries = await Promise.all(
      (selected ? [selected] : workCategories).map(async (category) => ({
        category,
        works: await published({ category }),
      })),
    );
    return { categories: workCategories, selected, galleries };
  };
