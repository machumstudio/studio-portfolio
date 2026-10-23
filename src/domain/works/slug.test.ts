import { describe, expect, it } from "vitest";
import { err, ok } from "@/shared/result";
import { parseSlug } from "./slug";

describe("parseSlug", () => {
  it.each(["faces-of-resilience", "a", "work-2022", "2022"])(
    "소문자/숫자를 하이픈 하나로 이은 %s 는 받는다",
    (value) => {
      expect(parseSlug(value)).toEqual(ok(value));
    },
  );

  it.each([
    "",
    "Faces",
    "faces of resilience",
    "-faces",
    "faces-",
    "faces--resilience",
    "faces_resilience",
    "얼굴들",
  ])("%j 는 InvalidSlug", (value) => {
    expect(parseSlug(value)).toEqual(err({ type: "InvalidSlug", value }));
  });
});
