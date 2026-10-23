import { parseSlug } from "@/domain/works/slug";
import type { Work } from "@/domain/works/work";
import { err, ok, type Result } from "@/shared/result";
import type { WorkRepository } from "./work-repository";

export type GetWorkBySlugError = { type: "NotFound"; slug: string };

// 작업 상세 (/work/[slug]). 주소에 맞지 않는 slug, 없는 작업, 비공개 작업은 모두 NotFound
// (비공개 작업이 있다는 것도 드러내지 않는다)
export const getWorkBySlug =
  ({ repo }: { repo: WorkRepository }) =>
  async (slug: string): Promise<Result<Work, GetWorkBySlugError>> => {
    const parsed = parseSlug(slug);
    const work = parsed.ok ? await repo.findBySlug(parsed.value) : null;
    return work?.published ? ok(work) : err({ type: "NotFound", slug });
  };
