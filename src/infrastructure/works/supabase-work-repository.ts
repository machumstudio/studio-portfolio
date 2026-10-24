import "server-only";
import type { WorkRepository } from "@/application/works/work-repository";
import type { Work } from "@/domain/works/work";
import { storageError, type SupabaseServerClient } from "../supabase/client";
import { toWork, type WorkRowWithImages } from "./supabase-work-mapper";

const columns =
  "id, slug, title_ko, title_en, category, year_month, published, work_images (work_id, sort_order, src, alt_ko, alt_en, is_cover)";

// 규칙을 어긴 행은 건너뛰지 않고 거부한다. 메시지에는 작업 id 와 에러만 (docs/adr/0010)
const restore = (row: WorkRowWithImages): Work => {
  const result = toWork(row);
  if (!result.ok)
    throw new Error(
      `[supabase] 작업 ${row.id} 을 복원하지 못했다: ${JSON.stringify(result.error)}`,
    );
  return result.value;
};

// secret 키 클라이언트로 읽는다 (비공개 포함 전체. 공개 여부는 유스케이스가 거른다).
// 사이트의 공개 작업만이라면 publishable 키로도 되지만, 18칸 관리자가 같은 포트로 비공개도 읽는다
export function createSupabaseWorkRepository(
  client: SupabaseServerClient,
): WorkRepository {
  return {
    findAll: async () => {
      const { data, error } = await client.from("works").select(columns);
      if (error) throw storageError("작업 목록 읽기", error);
      return data.map(restore);
    },
    findBySlug: async (slug) => {
      const { data, error } = await client
        .from("works")
        .select(columns)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw storageError("작업 읽기", error);
      return data ? restore(data) : null;
    },
  };
}
