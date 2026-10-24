import type { AdminWorkRepository } from "@/application/works/admin-work-repository";
import type { Work } from "@/domain/works/work";

// 인메모리 작업 저장소 (단위 테스트, DATA_STORE=memory 인 e2e/로컬). 받은 목록을 복사해 두고 고친다.
// 공개 화면과 관리자 화면이 같은 저장소를 써서, 관리자가 저장한 작업이 서버 프로세스가 살아 있는 동안 공개 화면에 보인다
export function createInMemoryWorkRepository(
  works: readonly Work[],
): AdminWorkRepository {
  const store = new Map(works.map((work) => [work.id, work]));
  const find = (match: (work: Work) => boolean) =>
    [...store.values()].find(match) ?? null;
  return {
    findAll: async () => [...store.values()],
    findBySlug: async (slug) => find((w) => w.slug === slug),
    findById: async (id) => store.get(id) ?? null,
    save: async (work) => {
      if (find((w) => w.slug === work.slug && w.id !== work.id))
        return "slug-taken";
      store.set(work.id, work);
      return "saved";
    },
    remove: async (id) => {
      store.delete(id);
    },
  };
}
