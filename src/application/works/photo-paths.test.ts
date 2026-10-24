import { describe, expect, it } from "vitest";
import { isPhotoPath, isStorableWorkId, photoPath } from "./photo-paths";

describe("photo-paths", () => {
  it.each(["work-01", "0b5c4a8e-1f2d-4c3b-9a7e-2d1f0c9b8a7e", "a"])(
    "작업 id %s 는 경로에 쓸 수 있다",
    (id) => {
      expect(isStorableWorkId(id)).toBe(true);
    },
  );

  it.each(["", "Work-01", "../x", "a/b", "a--b", "-a", "a".repeat(65)])(
    "작업 id %j 는 경로에 쓸 수 없다",
    (id) => {
      expect(isStorableWorkId(id)).toBe(false);
    },
  );

  it("photoPath 가 만든 경로는 isPhotoPath 를 통과한다", () => {
    const path = photoPath("work-01", "f00d-beef", "image/webp");
    expect(path).toBe("work-01/f00d-beef.webp");
    expect(isPhotoPath(path)).toBe(true);
  });

  it.each([
    "w-1/../w-2/a.jpg",
    "../w-2/a.jpg",
    "/w-1/a.jpg",
    "w-1/a.gif",
    "w-1/a.jpg?x=1",
    "w-1/b/a.jpg",
    "w-1/A.jpg",
    "a.jpg",
  ])("%j 는 사진 경로가 아니다", (path) => {
    expect(isPhotoPath(path)).toBe(false);
  });
});
