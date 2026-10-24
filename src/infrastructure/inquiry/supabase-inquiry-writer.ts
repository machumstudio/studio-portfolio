import "server-only";
import type { Inquiry } from "@/domain/inquiry/inquiry";
import { storageError, type SupabaseServerClient } from "../supabase/client";
import type { InquiryRow } from "../supabase/database";
import { toInquiryRow } from "./supabase-inquiry-mapper";

// inquiries 테이블을 통째로 바꾼다. 계약 테스트 준비와 끝난 뒤 되돌리기에만 쓴다
export async function replaceAllInquiryRows(
  client: SupabaseServerClient,
  rows: readonly InquiryRow[],
): Promise<void> {
  // PostgREST 는 조건 없는 delete 를 막는다. id 는 not null 이라 모든 행이 지워진다
  const removed = await client.from("inquiries").delete().not("id", "is", null);
  if (removed.error) throw storageError("문의 비우기", removed.error);
  if (rows.length === 0) return;
  const inserted = await client.from("inquiries").insert([...rows]);
  if (inserted.error) throw storageError("문의 넣기", inserted.error);
}

export const replaceAllInquiries = (
  client: SupabaseServerClient,
  inquiries: readonly Inquiry[],
) => replaceAllInquiryRows(client, inquiries.map(toInquiryRow));

// 되돌리기용으로 지금 행을 그대로 읽는다 (도메인 복원 없이)
export async function readAllInquiryRows(
  client: SupabaseServerClient,
): Promise<InquiryRow[]> {
  const { data, error } = await client.from("inquiries").select("*");
  if (error) throw storageError("문의 백업 읽기", error);
  return data;
}
