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
  /** 마지막으로 저장한 시각. sitemap 의 lastmod 가 된다 */
  readonly updatedAt: Date;
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
  /** 저장하는 유스케이스가 Clock 에서 받는다. 저장소에서 읽을 때는 저장된 값 */
  updatedAt: Date;
};

export type WorkError =
  | { type: "EmptyWorkId" }
  | SlugError
  | EmptyTitle
  | { type: "InvalidCategory"; value: string }
  | YearMonthError
  | ImageError
  | { type: "InvalidUpdatedAt" };

const isCategory = (value: string): value is WorkCategory =>
  (workCategories as readonly string[]).includes(value);

type EmptyTitle = { type: "EmptyTitle"; locale: keyof LocalizedText };

const parseTitleIn = (
  title: LocalizedText,
  locale: keyof LocalizedText,
): Result<string, EmptyTitle> => {
  const trimmed = title[locale].trim();
  return trimmed ? ok(trimmed) : err({ type: "EmptyTitle", locale });
};

const parseTitle = (title: LocalizedText): Result<LocalizedText, WorkError> =>
  flatMap(parseTitleIn(title, "ko"), (ko) =>
    map(parseTitleIn(title, "en"), (en) => ({ ko, en })),
  );

// 작업은 이 함수로만 만든다 (관리자 저장, 리포지토리에서 읽기, 시드 모두). 첫 번째 위반을 돌려준다
export function createWork(input: WorkInput): Result<Work, WorkError> {
  const id = input.id.trim();
  if (!id) return err({ type: "EmptyWorkId" });
  if (!isCategory(input.category))
    return err({ type: "InvalidCategory", value: input.category });
  const category = input.category;
  if (Number.isNaN(input.updatedAt.getTime()))
    return err({ type: "InvalidUpdatedAt" });
  const updatedAt = new Date(input.updatedAt);

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
            updatedAt,
          }),
        ),
      ),
    ),
  );
}

/** 관리자 폼의 칸별 오류. 칸 하나에 첫 번째 위반 하나 */
export type WorkFieldErrors = {
  slug?: SlugError;
  titleKo?: EmptyTitle;
  titleEn?: EmptyTitle;
  category?: { type: "InvalidCategory"; value: string };
  date?: YearMonthError;
  images?: ImageError;
};

const errorOf = <E>(result: Result<unknown, E>): E | undefined =>
  result.ok ? undefined : result.error;

// createWork 와 같은 규칙을 칸마다 따로 돌려 모든 칸의 오류를 한 번에 돌려준다 (관리자 폼이 틀린 칸을 다 표시한다).
// 빈 객체면 createWork 도 성공한다 (id 는 폼 칸이 아니라 여기서 보지 않는다)
export function validateWorkFields(input: WorkInput): WorkFieldErrors {
  const fields: WorkFieldErrors = {
    slug: errorOf(parseSlug(input.slug)),
    titleKo: errorOf(parseTitleIn(input.title, "ko")),
    titleEn: errorOf(parseTitleIn(input.title, "en")),
    category: isCategory(input.category)
      ? undefined
      : { type: "InvalidCategory", value: input.category },
    date: errorOf(parseYearMonth(input.date)),
    images: errorOf(arrangeImages(input.images, input.coverSrc)),
  };
  return Object.fromEntries(
    Object.entries(fields).filter(([, error]) => error),
  ) as WorkFieldErrors;
}
