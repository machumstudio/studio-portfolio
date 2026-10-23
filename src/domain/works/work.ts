import type { Brand } from "@/shared/brand";
import { err, flatMap, map, ok, type Result } from "@/shared/result";
import { arrangeImages, type ImageError, type WorkImage } from "./images";
import type { LocalizedText } from "./localized-text";
import { parseSlug, type Slug, type SlugError } from "./slug";
import {
  parseYearMonth,
  type YearMonth,
  type YearMonthError,
} from "./year-month";

export type WorkId = Brand<string, "WorkId">;

// 시안 Portfolio 페이지의 갤러리 묶음 (Portraits, Events, Commercial). 서비스 id 와 같다
export const workCategories = ["portrait", "events", "commercial"] as const;
export type WorkCategory = (typeof workCategories)[number];

export type Work = {
  readonly id: WorkId;
  readonly slug: Slug;
  readonly title: LocalizedText;
  readonly category: WorkCategory;
  readonly date: YearMonth;
  readonly cover: WorkImage;
  /** order 오름차순 */
  readonly images: readonly WorkImage[];
  readonly published: boolean;
};

export type WorkInput = {
  id: string;
  slug: string;
  title: LocalizedText;
  category: string;
  date: string;
  /** images 중 대표 이미지의 src */
  coverSrc: string;
  images: readonly WorkImage[];
  published: boolean;
};

export type WorkError =
  | { type: "EmptyWorkId" }
  | SlugError
  | { type: "EmptyTitle"; locale: keyof LocalizedText }
  | { type: "InvalidCategory"; value: string }
  | YearMonthError
  | ImageError;

const isCategory = (value: string): value is WorkCategory =>
  (workCategories as readonly string[]).includes(value);

const parseTitle = (title: LocalizedText): Result<LocalizedText, WorkError> => {
  const trimmed = { ko: title.ko.trim(), en: title.en.trim() };
  if (!trimmed.ko) return err({ type: "EmptyTitle", locale: "ko" });
  if (!trimmed.en) return err({ type: "EmptyTitle", locale: "en" });
  return ok(trimmed);
};

// 작업은 이 함수로만 만든다 (관리자 저장, 리포지토리에서 읽기, 시드 모두). 첫 번째 위반을 돌려준다
export function createWork(input: WorkInput): Result<Work, WorkError> {
  const id = input.id.trim();
  if (!id) return err({ type: "EmptyWorkId" });
  if (!isCategory(input.category))
    return err({ type: "InvalidCategory", value: input.category });
  const category = input.category;

  return flatMap(parseYearMonth(input.date), (date) =>
    flatMap(parseSlug(input.slug), (slug) =>
      flatMap(parseTitle(input.title), (title) =>
        map(
          arrangeImages(input.images, input.coverSrc),
          ({ images, cover }) => ({
            id: id as WorkId,
            slug,
            title,
            category,
            date,
            cover,
            images,
            published: input.published,
          }),
        ),
      ),
    ),
  );
}
