import "server-only";
import type { AdminWorkRepository } from "@/application/works/admin-work-repository";
import type { Work } from "@/domain/works/work";
import { storageError, type SupabaseServerClient } from "../supabase/client";
import {
  toWork,
  toWorkRows,
  type WorkRowWithImages,
} from "./supabase-work-mapper";

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

/** slug 의 unique 제약 (20261024000001_works.sql) */
const slugUnique = "works_slug_key";

// 같은 구현을 두 클라이언트로 쓴다 (docs/adr/0012).
// - 공개 사이트: secret 키 클라이언트로 읽기만 (비공개 포함 전체. 공개 여부는 유스케이스가 거른다)
// - 관리자: 요청의 관리자 세션 클라이언트로 읽고 쓴다. 관리자가 아닌 세션이면 RLS 가 비공개 작업을 숨기고 쓰기를 거부한다
export function createSupabaseWorkRepository(
  client: SupabaseServerClient,
): AdminWorkRepository {
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
    findById: async (id) => {
      const { data, error } = await client
        .from("works")
        .select(columns)
        .eq("id", id)
        .maybeSingle();
      if (error) throw storageError("작업 읽기", error);
      return data ? restore(data) : null;
    },
    // 작업과 사진을 save_work 함수 하나로 바꾼다 (한 트랜잭션, 20261025000001_save_work.sql)
    save: async (work) => {
      const rows = toWorkRows(work);
      const { error } = await client.rpc("save_work", {
        work: rows.work,
        images: rows.images,
      });
      if (!error) return "saved";
      if (error.code === "23505" && error.message.includes(slugUnique))
        return "slug-taken";
      throw storageError("작업 저장", error);
    },
    // 사진 행은 외래 키 on delete cascade 로 같이 지워진다
    remove: async (id) => {
      const { error } = await client.from("works").delete().eq("id", id);
      if (error) throw storageError("작업 지우기", error);
    },
  };
}
