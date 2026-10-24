import { createWork, type Work, type WorkError } from "@/domain/works/work";
import type { Result } from "@/shared/result";
import type { WorkImageRow, WorkRow } from "../supabase/database";

// works / work_images 행과 Work 사이의 모양 변환. 규칙 판단은 createWork 가 한다 (docs/adr/0010)

export type WorkRowWithImages = Omit<WorkRow, "created_at"> & {
  work_images: readonly WorkImageRow[];
};

/** 쓰기용: works 한 행과 work_images 여러 행 */
export type WorkRows = {
  work: Omit<WorkRow, "created_at">;
  images: WorkImageRow[];
};

export function toWork(row: WorkRowWithImages): Result<Work, WorkError> {
  // 같은 src 의 사진이 여럿이면 createWork 는 앞의 것을 대표로 본다. 순서대로 넘겨 저장 전과 같게 한다
  const sorted = [...row.work_images].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  return createWork({
    id: row.id,
    slug: row.slug,
    title: { ko: row.title_ko, en: row.title_en },
    category: row.category,
    date: row.year_month,
    // 대표 표시가 없으면 빈 src 로 넘겨 CoverNotInImages 로 드러낸다
    coverSrc: sorted.find((image) => image.is_cover)?.src ?? "",
    images: sorted.map((image) => ({
      src: image.src,
      alt: { ko: image.alt_ko, en: image.alt_en },
      order: image.sort_order,
    })),
    published: row.published,
    updatedAt: new Date(row.updated_at),
  });
}

export function toWorkRows(work: Work): WorkRows {
  return {
    work: {
      id: work.id,
      slug: work.slug,
      title_ko: work.title.ko,
      title_en: work.title.en,
      category: work.category,
      year_month: work.date,
      published: work.published,
      updated_at: work.updatedAt.toISOString(),
    },
    images: work.images.map((image) => ({
      work_id: work.id,
      sort_order: image.order,
      src: image.src,
      alt_ko: image.alt.ko,
      alt_en: image.alt.en,
      is_cover: image.order === work.cover.order,
    })),
  };
}
