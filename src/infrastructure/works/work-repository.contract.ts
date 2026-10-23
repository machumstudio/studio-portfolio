import { describe, expect, it } from "vitest";
import type { WorkRepository } from "@/application/works/work-repository";
import type { Slug } from "@/domain/works/slug";
import { createWork, type Work, type WorkInput } from "@/domain/works/work";

// WorkRepository 계약 테스트. 구현마다 *.test.ts 에서 불러 같은 시나리오를 돌린다:
//   describeWorkRepositoryContract("인메모리", (works) => createInMemoryWorkRepository(works));
// setup 은 테스트마다 works 만 들어 있는 새 저장소를 돌려준다 (Supabase 는 테이블을 비우고 넣는다)
export function describeWorkRepositoryContract(
  name: string,
  setup: (works: readonly Work[]) => WorkRepository | Promise<WorkRepository>,
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
});
const works = [wedding, secret, product];
const byId = (list: readonly Work[]) =>
  [...list].sort((a, b) => a.id.localeCompare(b.id));
