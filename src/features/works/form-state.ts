import type { PreparePhotoUploadError } from "@/application/works/prepare-photo-upload";
import type { UploadTicket } from "@/application/works/photo-storage";
import type {
  SaveWorkError,
  SaveWorkFieldErrors,
  SaveWorkResult,
} from "@/application/works/save-work";
import { assertNever } from "@/shared/assert-never";
import type { Result } from "@/shared/result";
import type { WorkFormValues } from "./schema";

// 편집 화면의 칸 이름 (화면 순서). 메시지 키는 AdminWorks.errors.<칸>.<code>
export const workFieldNames = [
  "titleKo",
  "titleEn",
  "slug",
  "category",
  "date",
  "photos",
] as const;
export type WorkFieldName = (typeof workFieldNames)[number];

export type WorkFieldError =
  | { code: "required" }
  | { code: "invalid" }
  | { code: "taken" }
  | { code: "cover" }
  | { code: "tooMany"; max: number }
  | { code: "unknown" };

export type WorkFormErrors = Partial<Record<WorkFieldName, WorkFieldError>>;

/** 칸 오류가 아닌 실패. 메시지 키는 AdminWorks.failures.<code> */
export type WorkFailureCode =
  /** 세션이 끝났다. 입력은 그대로 두고 다시 로그인하게 한다 */
  | "signedOut"
  /** 고치려던 작업이 없다 (다른 탭에서 지웠다) */
  | "notFound"
  /** 새 작업을 두 번 저장했다 */
  | "alreadyExists"
  | "unavailable"
  /** 화면이 보낸 값이 아니다 */
  | "malformed";

export type SaveWorkState =
  | { status: "saved"; id: string; slug: string; published: boolean }
  | { status: "invalid"; errors: WorkFormErrors }
  | { status: "error"; code: WorkFailureCode };

/** 지우기는 성공하면 목록으로 redirect 한다 */
export type DeleteWorkState = {
  status: "error";
  code: Extract<
    WorkFailureCode,
    "signedOut" | "notFound" | "unavailable" | "malformed"
  >;
};

export type UploadFailureCode =
  "unsupportedType" | "tooLarge" | "signedOut" | "unavailable" | "malformed";

export type PrepareUploadResult =
  { ok: true; ticket: UploadTicket } | { ok: false; code: UploadFailureCode };

const fieldError = (
  error: NonNullable<SaveWorkFieldErrors[keyof SaveWorkFieldErrors]>,
  values: WorkFormValues,
): WorkFieldError => {
  switch (error.type) {
    case "EmptyTitle":
      return { code: "required" };
    case "InvalidSlug":
    case "InvalidCategory":
    case "InvalidYearMonth":
    case "DuplicateImageOrder":
    case "MissingImageOrder":
      return { code: "invalid" };
    case "SlugTaken":
      return { code: "taken" };
    case "CoverNotInImages":
      // 사진이 하나도 없으면 "사진을 올려 주세요", 있는데 대표가 없으면 "대표 사진을 골라 주세요"
      return values.photos.length === 0
        ? { code: "required" }
        : { code: "cover" };
    case "TooManyPhotos":
      return { code: "tooMany", max: error.max };
    case "UnknownPhoto":
      return { code: "unknown" };
    default:
      return assertNever(error);
  }
};

// application 칸 이름 → 화면 칸 이름 (images → photos)
const fieldOf = {
  slug: "slug",
  titleKo: "titleKo",
  titleEn: "titleEn",
  category: "category",
  date: "date",
  images: "photos",
} as const satisfies Record<keyof SaveWorkFieldErrors, WorkFieldName>;

export function toWorkFormErrors(
  fields: SaveWorkFieldErrors,
  values: WorkFormValues,
): WorkFormErrors {
  const errors: WorkFormErrors = {};
  for (const key of Object.keys(fieldOf) as (keyof SaveWorkFieldErrors)[]) {
    const error = fields[key];
    if (error) errors[fieldOf[key]] = fieldError(error, values);
  }
  return errors;
}

/** 화면 순서로 첫 오류 칸. 저장 뒤 포커스를 옮길 곳 */
export const firstWorkErrorField = (
  errors: WorkFormErrors,
): WorkFieldName | undefined => workFieldNames.find((name) => errors[name]);

export function toSaveWorkState(
  result: Result<SaveWorkResult, SaveWorkError>,
  values: WorkFormValues,
): SaveWorkState {
  if (result.ok) {
    const { id, slug, published } = result.value.work;
    return { status: "saved", id, slug, published };
  }
  switch (result.error.type) {
    case "InvalidWork":
      return {
        status: "invalid",
        errors: toWorkFormErrors(result.error.fields, values),
      };
    case "NotFound":
      return { status: "error", code: "notFound" };
    case "AlreadyExists":
      return { status: "error", code: "alreadyExists" };
    case "StorageFailed":
      return { status: "error", code: "unavailable" };
    default:
      return assertNever(result.error);
  }
}

export function toUploadFailure(
  error: PreparePhotoUploadError,
): UploadFailureCode {
  switch (error.type) {
    case "UnsupportedPhotoType":
      return "unsupportedType";
    case "PhotoTooLarge":
      return "tooLarge";
    case "InvalidWorkId":
      return "malformed";
    case "StorageFailed":
      return "unavailable";
    default:
      return assertNever(error);
  }
}
