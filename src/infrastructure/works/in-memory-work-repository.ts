import type { WorkRepository } from "@/application/works/work-repository";
import type { Work } from "@/domain/works/work";

// 14칸 Supabase 어댑터 전까지 쓰는 저장소. 받은 목록을 복사해 두고 읽기만 한다
export function createInMemoryWorkRepository(
  works: readonly Work[],
): WorkRepository {
  const store = [...works];
  return {
    findAll: async () => [...store],
    findBySlug: async (slug) => store.find((w) => w.slug === slug) ?? null,
  };
}
