import { describe, expect, it, vi } from "vitest";
import { createWork, type Work, type WorkInput } from "@/domain/works/work";
import { err, ok } from "@/shared/result";
import { getAdjacentWorks } from "./get-adjacent-works";
import { getPublishedWorks } from "./get-published-works";
import { getWorkGalleries } from "./get-work-galleries";
import { getWorkBySlug } from "./get-work-by-slug";
import type { WorkRepository } from "./work-repository";

const work = (input: Partial<WorkInput> & Pick<WorkInput, "slug">): Work => {
  const result = createWork({
    id: input.slug,
    title: { ko: input.slug, en: input.slug },
    category: "portrait",
    date: "2020-01",
    coverSrc: "a.jpg",
    images: [{ src: "a.jpg", alt: { ko: "", en: "" }, order: 0 }],
    published: true,
    updatedAt: new Date("2026-10-01T00:00:00Z"),
    ...input,
  });
  if (!result.ok) throw new Error(result.error.type);
  return result.value;
};

// 포트만 지키는 인메모리 가짜. 순서를 일부러 섞어 둔다
const inMemory = (works: Work[]): WorkRepository => ({
  findAll: async () => works,
  findBySlug: async (slug) => works.find((w) => w.slug === slug) ?? null,
});

const works = [
  work({ slug: "brand", category: "commercial", date: "2019-05" }),
  work({ slug: "faces", category: "portrait", date: "2022-03" }),
  work({
    slug: "secret",
    category: "portrait",
    date: "2023-01",
    published: false,
  }),
  work({ slug: "wedding", category: "events", date: "2021-09" }),
  work({ slug: "monochrome", category: "portrait", date: "2020-01" }),
  work({ slug: "innocence", category: "portrait", date: "2020-01" }),
];
const repo = inMemory(works);
const slugs = (list: Work[]) => list.map((w) => w.slug);

describe("getPublishedWorks", () => {
  it("공개 작업만 촬영 연월 내림차순으로, 같은 달은 slug 순으로 돌려준다", async () => {
    expect(slugs(await getPublishedWorks({ repo })())).toEqual([
      "faces",
      "wedding",
      "innocence",
      "monochrome",
      "brand",
    ]);
  });

  it("카테고리를 주면 그 카테고리의 공개 작업만", async () => {
    expect(
      slugs(await getPublishedWorks({ repo })({ category: "portrait" })),
    ).toEqual(["faces", "innocence", "monochrome"]);
    expect(
      slugs(await getPublishedWorks({ repo })({ category: "events" })),
    ).toEqual(["wedding"]);
  });

  it("limit 을 주면 최신순으로 그 개수까지만 (카테고리와 같이 쓸 수 있다)", async () => {
    expect(slugs(await getPublishedWorks({ repo })({ limit: 2 }))).toEqual([
      "faces",
      "wedding",
    ]);
    expect(
      slugs(
        await getPublishedWorks({ repo })({ category: "portrait", limit: 2 }),
      ),
    ).toEqual(["faces", "innocence"]);
    expect(
      await getPublishedWorks({ repo })({ category: "events", limit: 10 }),
    ).toHaveLength(1);
  });

  it("작업이 없으면 빈 목록", async () => {
    expect(await getPublishedWorks({ repo: inMemory([]) })()).toEqual([]);
  });

  it("저장소의 목록을 바꾸지 않는다", async () => {
    const before = slugs(works);
    await getPublishedWorks({ repo })();
    expect(slugs(works)).toEqual(before);
  });
});

describe("getWorkBySlug", () => {
  it("공개 작업은 찾아 준다", async () => {
    expect(await getWorkBySlug({ repo })("wedding")).toEqual(ok(works[3]));
  });

  it("비공개 작업은 NotFound", async () => {
    expect(await getWorkBySlug({ repo })("secret")).toEqual(
      err({ type: "NotFound", slug: "secret" }),
    );
  });

  it("없는 작업은 NotFound", async () => {
    expect(await getWorkBySlug({ repo })("nope")).toEqual(
      err({ type: "NotFound", slug: "nope" }),
    );
  });

  it("주소에 맞지 않는 slug 는 저장소에 묻지 않고 NotFound", async () => {
    const findBySlug = vi.fn(repo.findBySlug);
    expect(
      await getWorkBySlug({ repo: { ...repo, findBySlug } })("Not A Slug"),
    ).toEqual(err({ type: "NotFound", slug: "Not A Slug" }));
    expect(findBySlug).not.toHaveBeenCalled();
  });
});

describe("getWorkGalleries", () => {
  const galleries = async (category?: string) => {
    const result = await getWorkGalleries({ repo })(category);
    return {
      ...result,
      galleries: result.galleries.map((g) => [g.category, slugs(g.works)]),
    };
  };

  it("카테고리가 없으면 인물, 이벤트, 광고 순서로 공개 작업을 최신순으로 묶는다", async () => {
    expect(await galleries()).toEqual({
      categories: ["portrait", "events", "commercial"],
      selected: null,
      galleries: [
        ["portrait", ["faces", "innocence", "monochrome"]],
        ["events", ["wedding"]],
        ["commercial", ["brand"]],
      ],
    });
  });

  it("아는 카테고리면 그 묶음 하나만", async () => {
    expect(await galleries("events")).toEqual({
      categories: ["portrait", "events", "commercial"],
      selected: "events",
      galleries: [["events", ["wedding"]]],
    });
  });

  it.each(["", "wedding", "Portrait"])(
    "모르는 카테고리 %j 는 전체로 본다",
    async (category) => {
      const result = await galleries(category);
      expect(result.selected).toBeNull();
      expect(result.galleries).toHaveLength(3);
    },
  );

  it("공개 작업이 없는 카테고리도 빈 묶음으로 남는다", async () => {
    expect(
      (await getWorkGalleries({ repo: inMemory([]) })()).galleries,
    ).toEqual([
      { category: "portrait", works: [] },
      { category: "events", works: [] },
      { category: "commercial", works: [] },
    ]);
  });
});

describe("getAdjacentWorks", () => {
  const adjacent = async (slug: string) => {
    const { previous, next } = await getAdjacentWorks({ repo })(slug);
    return [previous?.slug ?? null, next?.slug ?? null];
  };

  // Portfolio 순서: faces, innocence, monochrome | wedding | brand
  it.each([
    ["faces", null, "innocence"],
    ["monochrome", "innocence", "wedding"],
    ["wedding", "monochrome", "brand"],
    ["brand", "wedding", null],
  ])(
    "%s 의 이전은 %s, 다음은 %s (카테고리를 넘어 이어진다)",
    async (slug, previous, next) => {
      expect(await adjacent(slug)).toEqual([previous, next]);
    },
  );

  it.each(["secret", "nope"])("목록에 없는 %s 는 둘 다 null", async (slug) => {
    expect(await adjacent(slug)).toEqual([null, null]);
  });
});
