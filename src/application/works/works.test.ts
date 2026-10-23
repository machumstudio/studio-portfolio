import { describe, expect, it, vi } from "vitest";
import { createWork, type Work, type WorkInput } from "@/domain/works/work";
import { err, ok } from "@/shared/result";
import { getPublishedWorks } from "./get-published-works";
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
