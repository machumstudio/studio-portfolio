import "server-only";
import type { Work } from "@/domain/works/work";
import { storageError, type SupabaseServerClient } from "../supabase/client";
import { toWorkRows } from "./supabase-work-mapper";

// works 테이블을 주어진 작업들로 통째로 바꾼다. 시드 스크립트(pnpm db:seed)와 계약 테스트 준비에만 쓴다.
// PostgREST 는 트랜잭션을 묶지 않아서, 지우고 넣는 사이에 잠깐 비어 보일 수 있다 (사진은 cascade 로 같이 지워진다)
export async function replaceAllWorks(
  client: SupabaseServerClient,
  works: readonly Work[],
): Promise<void> {
  // id 는 빈 문자열일 수 없어서(제약) 모든 행이 지워진다. PostgREST 는 조건 없는 delete 를 막는다
  const removed = await client.from("works").delete().neq("id", "");
  if (removed.error) throw storageError("작업 비우기", removed.error);
  if (works.length === 0) return;

  const rows = works.map(toWorkRows);
  const inserted = await client
    .from("works")
    .insert(rows.map((row) => row.work));
  if (inserted.error) throw storageError("작업 넣기", inserted.error);

  const images = await client
    .from("work_images")
    .insert(rows.flatMap((row) => row.images));
  if (images.error) throw storageError("작업 사진 넣기", images.error);
}
