import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database";

export type SupabaseServerClient = SupabaseClient<Database>;

export type SupabaseServerEnv = { url: string; secretKey: string };

type Env = Readonly<Record<string, string | undefined>>;

// 서버에서 쓰는 Supabase 접속 정보. 값이 하나라도 없거나 DATA_STORE=memory 면 null (인메모리로 동작).
// secret 키는 RLS 를 우회하므로 NEXT_PUBLIC_ 이 붙지 않은 이름으로만 읽는다 (클라이언트 번들에 들어가지 않는다)
export function readSupabaseServerEnv(
  env: Env = process.env,
): SupabaseServerEnv | null {
  if (env.DATA_STORE === "memory") return null;
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = env.SUPABASE_SECRET_KEY?.trim();
  return url && secretKey ? { url, secretKey } : null;
}

// 요청마다 사용자 세션이 없는 서버 전용 클라이언트. 로그인 상태를 저장하거나 갱신하지 않는다
export const createSupabaseServerClient = ({
  url,
  secretKey,
}: SupabaseServerEnv): SupabaseServerClient =>
  createClient<Database>(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

// supabase-js 는 실패를 { error } 로 돌려준다. 포트 규약(저장소 장애는 Promise 거부)에 맞춰 던진다.
// 메시지에는 무엇을 하다 실패했는지와 Postgres 코드만 넣는다 (행 내용은 넣지 않는다)
export function storageError(
  action: string,
  error: { code?: string; message: string },
): Error {
  return new Error(
    `[supabase] ${action} 실패${error.code ? ` (${error.code})` : ""}: ${error.message}`,
    { cause: error },
  );
}

// PostgREST 는 한 응답의 행 수를 서버 설정(max-rows, Supabase 기본 1000)으로 자른다. 오류 없이 앞부분만 온다.
// 전부 읽어야 하는 곳은 정렬이 고정된 범위 조회를 빈 응답이 나올 때까지 이어 붙인다 (한도 값에 기대지 않는다)
export async function selectAllPages<Row>(
  action: string,
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: Row[] | null;
    error: { code?: string; message: string } | null;
  }>,
  batch = 1000,
): Promise<Row[]> {
  const rows: Row[] = [];
  for (;;) {
    const { data, error } = await page(rows.length, rows.length + batch - 1);
    if (error) throw storageError(action, error);
    if (!data || data.length === 0) return rows;
    rows.push(...data);
  }
}
