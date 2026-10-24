import { describe, expect, it } from "vitest";
import { editorReducer, suggestSlug, type EditorState } from "./editor-state";

const state = (patch: Partial<EditorState> = {}): EditorState => ({
  id: "w-1",
  isNew: true,
  titleKo: "",
  titleEn: "",
  slug: "",
  category: "",
  date: "",
  published: false,
  photos: [],
  coverSrc: "",
  slugTouched: false,
  ...patch,
});

const photos = (...srcs: string[]) =>
  srcs.map((src) => ({ src, altKo: "", altEn: "" }));
const srcs = (s: EditorState) => s.photos.map((p) => p.src);

describe("suggestSlug", () => {
  it.each([
    ["A Wedding Tale", "a-wedding-tale"],
    ["  Café  Moments!! 2024 ", "cafe-moments-2024"],
    ["서울의 밤", ""],
  ])("%j → %j", (title, slug) => {
    expect(suggestSlug(title)).toBe(slug);
  });
});

describe("editorReducer", () => {
  it("새 작업은 주소 이름을 직접 고치기 전까지 영어 제목을 따라간다", () => {
    let s = editorReducer(state(), {
      type: "setText",
      field: "titleEn",
      value: "Jeju Wedding",
    });
    expect(s.slug).toBe("jeju-wedding");
    s = editorReducer(s, { type: "setText", field: "slug", value: "jeju" });
    s = editorReducer(s, { type: "setText", field: "titleEn", value: "X" });
    expect(s.slug).toBe("jeju");
  });

  it("있는 작업은 제목을 바꿔도 주소 이름이 그대로다 (공유한 주소가 깨지지 않게)", () => {
    const s = editorReducer(state({ isNew: false, slug: "old" }), {
      type: "setText",
      field: "titleEn",
      value: "New Title",
    });
    expect(s.slug).toBe("old");
  });

  it("첫 사진을 올리면 대표가 된다. 그 뒤 사진은 대표를 바꾸지 않는다. 같은 사진은 두 번 들어가지 않는다", () => {
    let s = editorReducer(state(), { type: "addPhoto", src: "a" });
    s = editorReducer(s, { type: "addPhoto", src: "b" });
    s = editorReducer(s, { type: "addPhoto", src: "b" });
    expect(srcs(s)).toEqual(["a", "b"]);
    expect(s.coverSrc).toBe("a");
  });

  it("대표를 빼면 남은 첫 사진이 대표, 다 빼면 대표도 없다", () => {
    let s = state({ photos: photos("a", "b", "c"), coverSrc: "b" });
    s = editorReducer(s, { type: "removePhoto", index: 1 });
    expect([srcs(s), s.coverSrc]).toEqual([["a", "c"], "a"]);
    s = editorReducer(s, { type: "removePhoto", index: 1 });
    s = editorReducer(s, { type: "removePhoto", index: 0 });
    expect([srcs(s), s.coverSrc]).toEqual([[], ""]);
  });

  it("대표가 아닌 사진을 빼면 대표는 그대로", () => {
    const s = editorReducer(
      state({ photos: photos("a", "b"), coverSrc: "b" }),
      { type: "removePhoto", index: 0 },
    );
    expect(s.coverSrc).toBe("b");
  });

  it.each([
    [0, 2, ["b", "c", "a"]],
    [2, 0, ["c", "a", "b"]],
    [1, 0, ["b", "a", "c"]],
    // 범위 밖은 그대로
    [0, -1, ["a", "b", "c"]],
    [2, 3, ["a", "b", "c"]],
  ])("movePhoto %i → %i", (from, to, expected) => {
    const s = editorReducer(state({ photos: photos("a", "b", "c") }), {
      type: "movePhoto",
      from,
      to,
    });
    expect(srcs(s)).toEqual(expected);
  });

  it("setCover 는 목록 안의 사진만", () => {
    const s = state({ photos: photos("a", "b"), coverSrc: "a" });
    expect(editorReducer(s, { type: "setCover", src: "b" }).coverSrc).toBe("b");
    expect(editorReducer(s, { type: "setCover", src: "z" }).coverSrc).toBe("a");
  });

  it("setAlt 는 그 사진의 그 언어만", () => {
    const s = editorReducer(state({ photos: photos("a", "b") }), {
      type: "setAlt",
      index: 1,
      locale: "en",
      value: "Bride",
    });
    expect(s.photos).toEqual([
      { src: "a", altKo: "", altEn: "" },
      { src: "b", altKo: "", altEn: "Bride" },
    ]);
  });
});
