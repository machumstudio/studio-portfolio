import { describe, expect, it } from "vitest";
import { createWork, type Work } from "@/domain/works/work";
import { err } from "@/shared/result";
import { seedWorks } from "./seed";
import {
  toWork,
  toWorkRows,
  type WorkRowWithImages,
} from "./supabase-work-mapper";

const joined = (work: Work): WorkRowWithImages => {
  const { work: row, images } = toWorkRows(work);
  return { ...row, work_images: images };
};

const work = (() => {
  const result = createWork({
    id: "work-01",
    slug: "a-wedding-tale",
    title: { ko: "어느 결혼식 이야기", en: "A Wedding Tale" },
    category: "events",
    date: "2021-09",
    coverSrc: "/w/2.jpg",
    images: [
      { src: "/w/1.jpg", alt: { ko: "입장", en: "Entrance" }, order: 0 },
      { src: "/w/2.jpg", alt: { ko: "반지", en: "Rings" }, order: 1 },
    ],
    published: true,
  });
  if (!result.ok) throw new Error(result.error.type);
  return result.value;
})();

const rows: WorkRowWithImages = {
  id: "work-01",
  slug: "a-wedding-tale",
  title_ko: "어느 결혼식 이야기",
  title_en: "A Wedding Tale",
  category: "events",
  year_month: "2021-09",
  published: true,
  work_images: [
    {
      work_id: "work-01",
      sort_order: 0,
      src: "/w/1.jpg",
      alt_ko: "입장",
      alt_en: "Entrance",
      is_cover: false,
    },
    {
      work_id: "work-01",
      sort_order: 1,
      src: "/w/2.jpg",
      alt_ko: "반지",
      alt_en: "Rings",
      is_cover: true,
    },
  ],
};

describe("toWorkRows", () => {
  it("칼럼 이름으로 펼치고 대표 사진에만 is_cover 를 둔다", () => {
    const { work_images, ...row } = rows;
    expect(toWorkRows(work)).toEqual({ work: row, images: work_images });
  });
});

describe("toWork", () => {
  it("행을 Work 로 되돌린다 (toWorkRows 의 반대)", () => {
    expect(toWork(rows)).toEqual({ ok: true, value: work });
  });

  it("사진 행이 섞여 와도 순서대로 정리한다", () => {
    expect(
      toWork({ ...rows, work_images: [...rows.work_images].reverse() }),
    ).toEqual({ ok: true, value: work });
  });

  it("같은 src 가 여럿이면 앞 순서의 사진이 대표다 (시드의 임시 이미지)", () => {
    const same = rows.work_images.map((image) => ({
      ...image,
      src: "/p.svg",
      is_cover: image.sort_order === 0,
    }));
    const restored = toWork({ ...rows, work_images: [...same].reverse() });
    expect(restored.ok && restored.value.cover.order).toBe(0);
  });

  it("규칙을 어긴 행은 createWork 의 에러를 그대로 돌려준다", () => {
    expect(toWork({ ...rows, category: "food" })).toEqual(
      err({ type: "InvalidCategory", value: "food" }),
    );
    expect(
      toWork({
        ...rows,
        work_images: rows.work_images.map((i) => ({ ...i, is_cover: false })),
      }),
    ).toEqual(err({ type: "CoverNotInImages", src: "" }));
  });

  it("시드 작업도 왕복해서 같다", () => {
    for (const seed of seedWorks)
      expect(toWork(joined(seed))).toEqual({ ok: true, value: seed });
  });
});
