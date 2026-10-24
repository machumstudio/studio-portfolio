import type { WorkFormValues } from "../schema";

export type EditorPhoto = WorkFormValues["photos"][number];

// 편집 화면 상태. 서버 액션에 그대로 보내는 값(WorkFormValues)과 같다.
// 사진 순서는 배열 순서, 대표는 coverSrc. 대표 규칙(정확히 1개)이 편집 중에도 깨지지 않게 리듀서가 맞춘다:
// 첫 사진을 올리면 그 사진이 대표, 대표를 빼면 남은 첫 사진이 대표
export type EditorAction =
  | {
      type: "setText";
      field: "titleKo" | "titleEn" | "slug" | "category" | "date";
      value: string;
    }
  | { type: "setPublished"; value: boolean }
  | { type: "addPhoto"; src: string }
  | { type: "removePhoto"; index: number }
  | { type: "movePhoto"; from: number; to: number }
  | { type: "setCover"; src: string }
  | { type: "setAlt"; index: number; locale: "ko" | "en"; value: string }
  /** 저장했다: 이제 있는 작업이라 주소 이름이 제목을 따라가지 않는다 */
  | { type: "saved" };

export type EditorState = WorkFormValues & {
  /** 주소 이름을 직접 고쳤는지. 새 작업에서 고치기 전까지는 영어 제목을 따라간다 */
  slugTouched: boolean;
};

/** 영어 제목 → 주소 이름 후보: 소문자, 영문/숫자 밖의 글자는 하이픈 하나로 */
export const suggestSlug = (title: string) =>
  title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function editorReducer(
  state: EditorState,
  action: EditorAction,
): EditorState {
  switch (action.type) {
    case "setText": {
      const next = { ...state, [action.field]: action.value };
      if (action.field === "slug") return { ...next, slugTouched: true };
      if (action.field === "titleEn" && state.isNew && !state.slugTouched)
        return { ...next, slug: suggestSlug(action.value) };
      return next;
    }
    case "setPublished":
      return { ...state, published: action.value };
    case "addPhoto":
      if (state.photos.some((photo) => photo.src === action.src)) return state;
      return {
        ...state,
        photos: [...state.photos, { src: action.src, altKo: "", altEn: "" }],
        coverSrc: state.coverSrc || action.src,
      };
    case "removePhoto": {
      const removed = state.photos[action.index];
      if (!removed) return state;
      const photos = state.photos.filter((_, i) => i !== action.index);
      return {
        ...state,
        photos,
        coverSrc:
          removed.src === state.coverSrc
            ? (photos[0]?.src ?? "")
            : state.coverSrc,
      };
    }
    case "movePhoto": {
      const { from, to } = action;
      if (
        from === to ||
        !state.photos[from] ||
        to < 0 ||
        to >= state.photos.length
      )
        return state;
      const photos = [...state.photos];
      const [moved] = photos.splice(from, 1);
      photos.splice(to, 0, moved!);
      return { ...state, photos };
    }
    case "setCover":
      return state.photos.some((photo) => photo.src === action.src)
        ? { ...state, coverSrc: action.src }
        : state;
    case "saved":
      return { ...state, isNew: false, slugTouched: true };
    case "setAlt":
      return {
        ...state,
        photos: state.photos.map((photo, i) =>
          i === action.index
            ? {
                ...photo,
                [action.locale === "ko" ? "altKo" : "altEn"]: action.value,
              }
            : photo,
        ),
      };
  }
}

/** 서버에 보낼 값 (화면 전용 slugTouched 를 뺀다) */
export const toFormValues = (state: EditorState): WorkFormValues => ({
  id: state.id,
  isNew: state.isNew,
  titleKo: state.titleKo,
  titleEn: state.titleEn,
  slug: state.slug,
  category: state.category,
  date: state.date,
  published: state.published,
  photos: state.photos,
  coverSrc: state.coverSrc,
});
