import "server-only";
import type { AdminInquiryRepository } from "@/application/inquiry/admin-inquiry-repository";
import type { Inquiry } from "@/domain/inquiry/inquiry";
import {
  inquiryStatusTypes,
  type InquiryStatusType,
} from "@/domain/inquiry/status";
import {
  selectAllPages,
  storageError,
  type SupabaseServerClient,
} from "../supabase/client";
import type { InquiryRow } from "../supabase/database";
import {
  statusColumn,
  toInquiry,
  toInquiryRow,
} from "./supabase-inquiry-mapper";

const columns =
  "id, first_name, last_name, email, phone, message, received_at, status, status_changed_at";

// id 칼럼은 uuid 다. 형식이 다른 값(관리자 주소에 직접 친 값 등)은 묻지 않고 "없음"으로 본다.
// 그대로 보내면 Postgres 가 22P02 로 거절해 저장소 장애처럼 보인다
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 규칙을 어긴 행은 거부한다. 메시지에는 문의 id 와 에러 종류만 (이름, 이메일, 메시지는 넣지 않는다. docs/adr/0010)
const restore = (row: InquiryRow): Inquiry => {
  const result = toInquiry(row);
  if (!result.ok)
    throw new Error(
      `[supabase] 문의 ${row.id} 을 복원하지 못했다: ${JSON.stringify(result.error)}`,
    );
  return result.value;
};

// 클라이언트는 둘 중 하나다 (docs/adr/0012):
// - secret 키: 공개 문의 폼의 새 문의 저장 (container.inquiry.repo)
// - 요청의 관리자 세션: 관리자 화면의 목록, 상태 변경, 지우기 (RLS 정책 is_admin). 관리자에게는 insert 권한이 없다
export function createSupabaseInquiryRepository(
  client: SupabaseServerClient,
): AdminInquiryRepository {
  const countStatus = async (type: InquiryStatusType) => {
    const { count, error } = await client
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", statusColumn[type]);
    if (error) throw storageError("문의 개수 세기", error);
    return count ?? 0;
  };

  return {
    // 있으면 고치고(update) 없으면 넣는다(insert). upsert(insert ... on conflict) 는 insert 권한이 있어야 해서
    // 관리자 세션의 상태 변경이 42501 로 막힌다. 공개 폼의 새 문의는 update 가 0행이라 insert 로 넘어간다
    save: async (inquiry) => {
      const row = toInquiryRow(inquiry);
      const updated = await client
        .from("inquiries")
        .update(row)
        .eq("id", row.id)
        .select("id");
      if (updated.error) throw storageError("문의 저장", updated.error);
      if (updated.data.length > 0) return;
      const inserted = await client.from("inquiries").insert(row);
      if (inserted.error) throw storageError("문의 저장", inserted.error);
    },
    findById: async (id) => {
      if (!uuidPattern.test(id)) return null;
      const { data, error } = await client
        .from("inquiries")
        .select(columns)
        .eq("id", id)
        .maybeSingle();
      if (error) throw storageError("문의 읽기", error);
      return data ? restore(data) : null;
    },
    findAll: async () =>
      (
        await selectAllPages("문의 목록 읽기", (from, to) =>
          client.from("inquiries").select(columns).order("id").range(from, to),
        )
      ).map(restore),
    // head 요청이라 행을 받지 않고 개수만 받는다 (응답 행 수 한도와 무관)
    countByStatus: async () => {
      const [New = 0, Read = 0, Done = 0] = await Promise.all(
        inquiryStatusTypes.map(countStatus),
      );
      return { New, Read, Done };
    },
    // 범위 조회(offset, limit). 한 페이지는 응답 행 수 한도(기본 1000)보다 훨씬 작다.
    // 같은 시각이 있어도 페이지 사이에서 빠지거나 겹치지 않게 id 로 한 번 더 정렬한다
    findPage: async ({ status, offset, limit }) => {
      if (limit <= 0) return [];
      let query = client.from("inquiries").select(columns);
      if (status) query = query.eq("status", statusColumn[status]);
      const { data, error } = await query
        .order("received_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw storageError("문의 목록 읽기", error);
      return data.map(restore);
    },
    remove: async (id) => {
      if (!uuidPattern.test(id)) return false;
      const { data, error } = await client
        .from("inquiries")
        .delete()
        .eq("id", id)
        .select("id");
      if (error) throw storageError("문의 지우기", error);
      return data.length > 0;
    },
  };
}
