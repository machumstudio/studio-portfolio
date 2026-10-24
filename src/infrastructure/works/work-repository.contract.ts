import { describe, expect, it } from "vitest";
import type { AdminWorkRepository } from "@/application/works/admin-work-repository";
import type { Slug } from "@/domain/works/slug";
import {
  createWork,
  type Work,
  type WorkId,
  type WorkInput,
} from "@/domain/works/work";

// AdminWorkRepository(공개 읽기 + 관리자 쓰기) 계약 테스트. 구현마다 *.test.ts 에서 불러 같은 시나리오를 돌린다:
//   describeWorkRepositoryContract("인메모리", (works) => createInMemoryWorkRepository(works));
// setup 은 테스트마다 works 만 들어 있는 새 저장소를 돌려준다 (Supabase 는 테이블을 비우고 넣는다)
export function describeWorkRepositoryContract(
  name: string,
  setup: (
    works: readonly Work[],
  ) => AdminWorkRepository | Promise<AdminWorkRepository>,
) {
  describe(`WorkRepository 계약: ${name}`, () => {
    it("findAll 은 비공개를 포함한 전체를 돌려준다 (순서 무관)", async () => {
      const repo = await setup(works);
      expect(byId(await repo.findAll())).toEqual(byId(works));
    });

    it("비어 있으면 findAll 은 빈 목록", async () => {
      const repo = await setup([]);
      expect(await repo.findAll()).toEqual([]);
    });

    it("findBySlug 는 모든 필드(ko/en 제목, 이미지 순서, 대표 이미지)를 그대로 돌려준다", async () => {
      const repo = await setup(works);
      expect(await repo.findBySlug(wedding.slug)).toEqual(wedding);
    });

    it("findBySlug 는 비공개 작업도 찾는다 (공개 여부는 유스케이스가 거른다)", async () => {
      const repo = await setup(works);
      expect(await repo.findBySlug(secret.slug)).toEqual(secret);
    });

    it("없는 slug 는 null", async () => {
      const repo = await setup(works);
      expect(await repo.findBySlug("nope" as Slug)).toBeNull();
    });

    it("findById 는 비공개도 찾고, 없으면 null", async () => {
      const repo = await setup(works);
      expect(await repo.findById(secret.id)).toEqual(secret);
      expect(await repo.findById("nope" as WorkId)).toBeNull();
    });

    it("save 는 새 작업을 넣는다", async () => {
      const repo = await setup(works);
      expect(await repo.save(added)).toBe("saved");
      expect(await repo.findById(added.id)).toEqual(added);
      expect(await repo.findAll()).toHaveLength(works.length + 1);
    });

    it("save 는 같은 id 의 작업을 사진까지 통째로 바꾼다 (사진 수가 줄어도)", async () => {
      const repo = await setup(works);
      expect(await repo.save(weddingEdited)).toBe("saved");
      expect(await repo.findById(wedding.id)).toEqual(weddingEdited);
      expect(await repo.findBySlug(wedding.slug)).toBeNull();
      // 다른 작업은 그대로
      expect(await repo.findById(product.id)).toEqual(product);
    });

    it("save 는 다른 작업의 slug 면 저장하지 않고 slug-taken", async () => {
      const repo = await setup(works);
      expect(await repo.save({ ...added, slug: product.slug })).toBe(
        "slug-taken",
      );
      expect(await repo.findById(added.id)).toBeNull();
      expect(await repo.save({ ...weddingEdited, slug: product.slug })).toBe(
        "slug-taken",
      );
      expect(await repo.findById(wedding.id)).toEqual(wedding);
    });

    it("remove 는 작업과 사진을 지운다. 없는 id 는 아무 일도 없다", async () => {
      const repo = await setup(works);
      await repo.remove(wedding.id);
      await repo.remove("nope" as WorkId);
      expect(await repo.findById(wedding.id)).toBeNull();
      expect(byId(await repo.findAll())).toEqual(byId([secret, product]));
    });
  });
}

const work = (input: WorkInput): Work => {
  const result = createWork(input);
  if (!result.ok)
    throw new Error(`계약 테스트 데이터 오류: ${result.error.type}`);
  return result.value;
};
const image = (src: string, order: number) => ({
  src,
  alt: { ko: `사진 ${order + 1}`, en: `Photo ${order + 1}` },
  order,
});

const wedding = work({
  id: "contract-wedding",
  slug: "a-wedding-tale",
  title: { ko: "어느 결혼식 이야기", en: "A Wedding Tale" },
  category: "events",
  date: "2021-09",
  coverSrc: "/w/2.jpg",
  images: [image("/w/1.jpg", 0), image("/w/2.jpg", 1), image("/w/3.jpg", 2)],
  published: true,
  updatedAt: new Date("2026-10-01T09:00:00.123Z"),
});
const secret = work({
  id: "contract-secret",
  slug: "secret",
  title: { ko: "비공개", en: "Private" },
  category: "portrait",
  date: "2023-01",
  coverSrc: "/s/1.jpg",
  images: [image("/s/1.jpg", 0)],
  published: false,
  updatedAt: new Date("2026-10-02T09:00:00Z"),
});
const product = work({
  id: "contract-product",
  slug: "product-elegance",
  title: { ko: "제품의 품격", en: "Product Elegance" },
  category: "commercial",
  date: "2020-08",
  coverSrc: "/p/1.jpg",
  images: [image("/p/1.jpg", 0), image("/p/2.jpg", 1)],
  published: true,
  updatedAt: new Date("2026-10-03T09:00:00Z"),
});
const works = [wedding, secret, product];

const added = work({
  id: "contract-added",
  slug: "fresh-work",
  title: { ko: "새 작업", en: "Fresh Work" },
  category: "portrait",
  date: "2024-02",
  coverSrc: "/n/2.jpg",
  images: [image("/n/1.jpg", 0), image("/n/2.jpg", 1)],
  published: false,
  updatedAt: new Date("2026-10-04T09:00:00Z"),
});
// 제목, slug, 공개 여부, 사진(3장 → 2장, 순서와 대표)을 모두 바꾼 결혼식 작업
const weddingEdited = work({
  id: wedding.id,
  slug: "a-wedding-tale-2",
  title: { ko: "어느 결혼식 이야기 2", en: "A Wedding Tale 2" },
  category: "events",
  date: "2021-10",
  coverSrc: "/w/3.jpg",
  images: [image("/w/3.jpg", 0), image("/w/1.jpg", 1)],
  published: false,
  // 저장소는 받은 수정 시각을 그대로 저장한다 (밀리초까지)
  updatedAt: new Date("2026-10-25T10:20:30.456Z"),
});
const byId = (list: readonly Work[]) =>
  [...list].sort((a, b) => a.id.localeCompare(b.id));
