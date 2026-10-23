import { describe, expect, it } from "vitest";
import { workCategories } from "@/domain/works/work";
import { seedWorks } from "./seed";

describe("seedWorks", () => {
  it("모든 카테고리에 공개 작업이 있고, 작업은 8개 이상, 비공개도 하나 이상", () => {
    const published = seedWorks.filter((w) => w.published);
    expect(seedWorks.length).toBeGreaterThanOrEqual(8);
    expect(new Set(published.map((w) => w.category))).toEqual(
      new Set(workCategories),
    );
    expect(seedWorks.some((w) => !w.published)).toBe(true);
  });

  it("id 와 slug 는 겹치지 않는다", () => {
    expect(new Set(seedWorks.map((w) => w.id)).size).toBe(seedWorks.length);
    expect(new Set(seedWorks.map((w) => w.slug)).size).toBe(seedWorks.length);
  });
});
