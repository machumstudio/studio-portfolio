import type { Slug } from "@/domain/works/slug";
import type { Work } from "@/domain/works/work";

// 작업 저장소 포트. 구현: infrastructure/works (인메모리, 14칸 Supabase).
// 두 구현은 infrastructure/works/work-repository.contract.ts 를 같이 통과해야 한다.
// 공개 여부, 카테고리, 정렬은 유스케이스가 정한다 (작업 수가 수십 개라 전부 읽어도 된다)
export type WorkRepository = {
  /** 비공개 포함 전체. 순서는 정해져 있지 않다 */
  findAll(): Promise<readonly Work[]>;
  /** 비공개 포함. 없으면 null */
  findBySlug(slug: Slug): Promise<Work | null>;
};
