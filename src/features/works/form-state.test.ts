import { describe, expect, it } from "vitest";
import { firstWorkErrorField, toWorkFormErrors } from "./form-state";
import type { WorkFormValues } from "./schema";

const values = (photos: number): WorkFormValues => ({
  id: "w",
  isNew: true,
  titleKo: "",
  titleEn: "",
  slug: "",
  category: "",
  date: "",
  published: false,
  photos: Array.from({ length: photos }, (_, i) => ({
    src: `/${i}.jpg`,
    altKo: "",
    altEn: "",
  })),
  coverSrc: "",
});

describe("toWorkFormErrors", () => {
  it("도메인 오류를 화면 칸과 코드로 바꾼다 (images → photos)", () => {
    expect(
      toWorkFormErrors(
        {
          slug: { type: "InvalidSlug", value: "X" },
          titleEn: { type: "EmptyTitle", locale: "en" },
          category: { type: "InvalidCategory", value: "x" },
          images: { type: "TooManyPhotos", max: 30 },
        },
        values(31),
      ),
    ).toEqual({
      slug: { code: "invalid" },
      titleEn: { code: "required" },
      category: { code: "invalid" },
      photos: { code: "tooMany", max: 30 },
    });
  });

  it("대표가 목록에 없으면: 사진이 없을 때 required, 있을 때 cover", () => {
    const error = { images: { type: "CoverNotInImages", src: "" } } as const;
    expect(toWorkFormErrors(error, values(0))).toEqual({
      photos: { code: "required" },
    });
    expect(toWorkFormErrors(error, values(2))).toEqual({
      photos: { code: "cover" },
    });
  });

  it("slug 중복은 taken, 모르는 사진은 unknown", () => {
    expect(
      toWorkFormErrors(
        {
          slug: { type: "SlugTaken" },
          images: { type: "UnknownPhoto", src: "x" },
        },
        values(1),
      ),
    ).toEqual({ slug: { code: "taken" }, photos: { code: "unknown" } });
  });
});

describe("firstWorkErrorField", () => {
  it("화면 순서로 첫 오류 칸", () => {
    expect(
      firstWorkErrorField({
        photos: { code: "required" },
        slug: { code: "taken" },
      }),
    ).toBe("slug");
    expect(firstWorkErrorField({})).toBeUndefined();
  });
});
