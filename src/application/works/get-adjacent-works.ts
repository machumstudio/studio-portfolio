import type { Work } from "@/domain/works/work";
import { getWorkGalleries } from "./get-work-galleries";
import type { WorkRepository } from "./work-repository";

export type AdjacentWorks = { previous: Work | null; next: Work | null };

// 작업 상세의 이전/다음 작업. Portfolio 페이지에 보이는 순서(카테고리 순서, 그 안은 최신순) 그대로 이어서
// 갤러리를 따라 보던 흐름이 상세에서도 이어지게 한다. 처음/끝에서 돌아가지 않는다.
// 목록에 없는 slug(없는 작업, 비공개)는 둘 다 null
export const getAdjacentWorks =
  ({ repo }: { repo: WorkRepository }) =>
  async (slug: string): Promise<AdjacentWorks> => {
    const { galleries } = await getWorkGalleries({ repo })();
    const works = galleries.flatMap((gallery) => gallery.works);
    const index = works.findIndex((work) => work.slug === slug);
    if (index === -1) return { previous: null, next: null };
    return {
      previous: works[index - 1] ?? null,
      next: works[index + 1] ?? null,
    };
  };
