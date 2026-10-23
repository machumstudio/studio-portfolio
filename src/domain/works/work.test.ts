import { describe, expect, it } from "vitest";
import { err } from "@/shared/result";
import type { WorkImage } from "./images";
import { createWork, type WorkInput } from "./work";

const image = (src: string, order: number): WorkImage => ({
  src,
  alt: { ko: `사진 ${order}`, en: `Photo ${order}` },
  order,
});

const valid: WorkInput = {
  id: "w1",
  slug: "faces-of-resilience",
  title: { ko: "단단한 얼굴들", en: "Faces of Resilience" },
  category: "portrait",
  date: "2022-03",
  coverSrc: "b.jpg",
  images: [image("b.jpg", 1), image("a.jpg", 0)],
  published: true,
};

describe("createWork", () => {
  it("올바른 입력이면 이미지를 순서대로 정렬한 Work 를 만든다", () => {
    expect(createWork(valid)).toEqual({
      ok: true,
      value: {
        id: "w1",
        slug: "faces-of-resilience",
        title: { ko: "단단한 얼굴들", en: "Faces of Resilience" },
        category: "portrait",
        date: "2022-03",
        cover: image("b.jpg", 1),
        images: [image("a.jpg", 0), image("b.jpg", 1)],
        published: true,
      },
    });
  });

  it("비공개 작업도 만들 수 있다", () => {
    const result = createWork({ ...valid, published: false });
    expect(result.ok && result.value.published).toBe(false);
  });

  it("id 와 제목의 앞뒤 공백은 지운다", () => {
    const result = createWork({
      ...valid,
      id: " w1 ",
      title: { ko: " 단단한 얼굴들 ", en: "Faces of Resilience\n" },
    });
    expect(result.ok && [result.value.id, result.value.title]).toEqual([
      "w1",
      { ko: "단단한 얼굴들", en: "Faces of Resilience" },
    ]);
  });

  it.each(["", "  "])("id %j 는 EmptyWorkId", (id) => {
    expect(createWork({ ...valid, id })).toEqual(err({ type: "EmptyWorkId" }));
  });

  it("slug 규칙은 Slug 값 객체를 따른다", () => {
    expect(createWork({ ...valid, slug: "Faces Of" })).toEqual(
      err({ type: "InvalidSlug", value: "Faces Of" }),
    );
  });

  it.each([
    { title: { ko: "", en: "Faces" }, locale: "ko" },
    { title: { ko: "얼굴", en: " " }, locale: "en" },
  ])("$locale 제목이 비면 EmptyTitle", ({ title, locale }) => {
    expect(createWork({ ...valid, title })).toEqual(
      err({ type: "EmptyTitle", locale }),
    );
  });

  it.each(["portrait", "events", "commercial"])(
    "카테고리 %s 는 받는다",
    (category) => {
      expect(createWork({ ...valid, category }).ok).toBe(true);
    },
  );

  it.each(["", "wedding", "Portrait"])(
    "카테고리 %j 는 InvalidCategory",
    (value) => {
      expect(createWork({ ...valid, category: value })).toEqual(
        err({ type: "InvalidCategory", value }),
      );
    },
  );

  it.each([
    "2022-3",
    "2022-00",
    "2022-13",
    "22-03",
    "2022-03-01",
    "March 2022",
  ])("날짜 %j 는 InvalidDate", (value) => {
    expect(createWork({ ...valid, date: value })).toEqual(
      err({ type: "InvalidDate", value }),
    );
  });

  it("이미지 순서 규칙 위반을 그대로 돌려준다", () => {
    expect(
      createWork({ ...valid, images: [image("a.jpg", 0), image("b.jpg", 0)] }),
    ).toEqual(err({ type: "DuplicateImageOrder", order: 0 }));
    expect(createWork({ ...valid, coverSrc: "z.jpg" })).toEqual(
      err({ type: "CoverNotInImages", src: "z.jpg" }),
    );
  });

  it("여러 규칙을 어기면 첫 번째 위반 하나만 돌려준다 (id → 카테고리 → 날짜 → slug → 제목 → 이미지)", () => {
    expect(
      createWork({ ...valid, category: "x", date: "x", slug: "X" }),
    ).toEqual(err({ type: "InvalidCategory", value: "x" }));
    expect(createWork({ ...valid, slug: "X", coverSrc: "z.jpg" })).toEqual(
      err({ type: "InvalidSlug", value: "X" }),
    );
  });
});
