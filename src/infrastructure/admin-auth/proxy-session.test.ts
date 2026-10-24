import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { memorySessionCookie } from "./in-memory-auth";
import { checkProxySession } from "./proxy-session";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const request = (cookie?: string) =>
  new NextRequest("http://localhost/admin", {
    headers: cookie ? { cookie } : {},
  });

describe("checkProxySession", () => {
  it("인메모리: 세션 쿠키가 있으면 통과 (계정 확인은 서버가 한다)", async () => {
    vi.stubEnv("DATA_STORE", "memory");
    expect(
      (await checkProxySession(request(`${memorySessionCookie}=t`)))
        .looksLikeAdmin,
    ).toBe(true);
    expect((await checkProxySession(request())).looksLikeAdmin).toBe(false);
  });

  it("꺼짐(env 없음): 쿠키가 있어도 통과하지 않는다", async () => {
    vi.stubEnv("DATA_STORE", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(
      (await checkProxySession(request(`${memorySessionCookie}=t`)))
        .looksLikeAdmin,
    ).toBe(false);
  });

  it("Supabase: 세션 쿠키가 없으면 인증 서버에 묻지 않고 통과하지 않는다", async () => {
    vi.stubEnv("DATA_STORE", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(await checkProxySession(request("other=1"))).toEqual({
      looksLikeAdmin: false,
      cookies: [],
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("Supabase: 서명을 확인할 수 없는 토큰 쿠키는 통과하지 않는다", async () => {
    vi.stubEnv("DATA_STORE", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    // 인증 서버는 이 토큰을 모른다고 답한다
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ code: "bad_jwt" }, { status: 403 })),
    );
    const forged = {
      access_token:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4IiwiYXBwX21ldGFkYXRhIjp7InJvbGUiOiJhZG1pbiJ9LCJleHAiOjk5OTk5OTk5OTl9.c2lnbmF0dXJl",
      refresh_token: "r",
      expires_at: 9999999999,
      expires_in: 3600,
      token_type: "bearer",
      user: { id: "x", app_metadata: { role: "admin" } },
    };
    const cookie = `sb-example-auth-token=base64-${Buffer.from(JSON.stringify(forged)).toString("base64url")}`;
    expect((await checkProxySession(request(cookie))).looksLikeAdmin).toBe(
      false,
    );
  });
});
