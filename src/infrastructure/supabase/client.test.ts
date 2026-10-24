import { describe, expect, it, vi } from "vitest";
import { readSupabaseServerEnv, selectAllPages, storageError } from "./client";

vi.mock("server-only", () => ({}));

const full = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_test",
};

describe("readSupabaseServerEnv", () => {
  it("URL 과 secret 키가 있으면 접속 정보", () => {
    expect(readSupabaseServerEnv(full)).toEqual({
      url: "https://example.supabase.co",
      secretKey: "sb_secret_test",
    });
  });

  it.each([
    ["URL 없음", { SUPABASE_SECRET_KEY: "sb_secret_test" }],
    [
      "secret 키 없음",
      { NEXT_PUBLIC_SUPABASE_URL: full.NEXT_PUBLIC_SUPABASE_URL },
    ],
    ["빈 값", { ...full, SUPABASE_SECRET_KEY: " " }],
    ["DATA_STORE=memory", { ...full, DATA_STORE: "memory" }],
  ])("%s 이면 null (인메모리)", (_, env) => {
    expect(readSupabaseServerEnv(env)).toBeNull();
  });

  it("publishable 키만으로는 서버 저장소를 만들지 않는다", () => {
    expect(
      readSupabaseServerEnv({
        NEXT_PUBLIC_SUPABASE_URL: full.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      }),
    ).toBeNull();
  });
});

describe("storageError", () => {
  it("동작과 Postgres 코드를 메시지에 넣고 원래 에러는 cause 로 둔다", () => {
    const cause = { code: "42501", message: "permission denied" };
    const error = storageError("문의 저장", cause);
    expect(error.message).toBe(
      "[supabase] 문의 저장 실패 (42501): permission denied",
    );
    expect(error.cause).toBe(cause);
  });
});

describe("selectAllPages", () => {
  // 서버가 요청한 범위와 상관없이 한 번에 max 행까지만 주는 PostgREST 흉내
  const capped = (rows: number[], max: number) =>
    vi.fn(async (from: number, to: number) => ({
      data: rows.slice(from, Math.min(to + 1, from + max)),
      error: null,
    }));

  it("서버 한도(max-rows)가 요청보다 작아도 빈 응답까지 이어 읽는다", async () => {
    const rows = Array.from({ length: 7 }, (_, i) => i);
    const page = capped(rows, 3);
    expect(await selectAllPages("읽기", page, 1000)).toEqual(rows);
    expect(page.mock.calls).toEqual([
      [0, 999],
      [3, 1002],
      [6, 1005],
      [7, 1006],
    ]);
  });

  it("비어 있으면 한 번만 묻고 빈 목록", async () => {
    const page = capped([], 1000);
    expect(await selectAllPages("읽기", page)).toEqual([]);
    expect(page).toHaveBeenCalledTimes(1);
  });

  it("오류는 무엇을 하다 실패했는지와 코드로 던진다", async () => {
    await expect(
      selectAllPages("문의 백업 읽기", async () => ({
        data: null,
        error: { code: "57014", message: "timeout" },
      })),
    ).rejects.toThrow("[supabase] 문의 백업 읽기 실패 (57014): timeout");
  });
});
