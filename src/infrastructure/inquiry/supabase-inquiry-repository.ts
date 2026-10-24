import "server-only";
import type { InquiryRepository } from "@/application/inquiry/inquiry-repository";
import type { Inquiry } from "@/domain/inquiry/inquiry";
import { storageError, type SupabaseServerClient } from "../supabase/client";
import type { InquiryRow } from "../supabase/database";
import { toInquiry, toInquiryRow } from "./supabase-inquiry-mapper";

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

// inquiries 는 RLS 정책이 없어 secret 키 클라이언트로만 읽고 쓴다 (supabase/migrations)
export function createSupabaseInquiryRepository(
  client: SupabaseServerClient,
): InquiryRepository {
  return {
    save: async (inquiry) => {
      const { error } = await client
        .from("inquiries")
        .upsert(toInquiryRow(inquiry), { onConflict: "id" });
      if (error) throw storageError("문의 저장", error);
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
    findAll: async () => {
      const { data, error } = await client.from("inquiries").select(columns);
      if (error) throw storageError("문의 목록 읽기", error);
      return data.map(restore);
    },
  };
}
