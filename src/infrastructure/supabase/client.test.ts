import { describe, expect, it, vi } from "vitest";
import { readSupabaseServerEnv, storageError } from "./client";

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
