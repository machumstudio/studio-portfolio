import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
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

describe("seedWorks 사진", () => {
  it("작업마다 3장, 첫 장이 대표, 파일이 public 에 있고 장당 700KB 이하", () => {
    for (const work of seedWorks) {
      expect(work.images).toHaveLength(3);
      expect(work.cover).toEqual(work.images[0]);
      for (const { src } of work.images) {
        const file = join(process.cwd(), "public", src);
        expect(existsSync(file), src).toBe(true);
        expect(statSync(file).size, src).toBeLessThanOrEqual(700 * 1024);
      }
    }
  });

  it("모든 사진에 ko/en alt 가 있다", () => {
    for (const { alt } of seedWorks.flatMap((w) => w.images)) {
      expect(alt.ko).not.toBe("");
      expect(alt.en).not.toBe("");
    }
  });
});
