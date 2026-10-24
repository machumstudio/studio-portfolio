import { afterEach, describe, expect, it, vi } from "vitest";
import { createTestCookieJar } from "./cookie-jar";
import {
  createSupabaseAuthGateway,
  readSupabaseAuthEnv,
} from "./supabase-auth-gateway";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("readSupabaseAuthEnv", () => {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: " https://example.supabase.co ",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  };

  it("URL 과 publishable 키 (secret 키는 쓰지 않는다)", () => {
    expect(readSupabaseAuthEnv({ ...env, NODE_ENV: "production" })).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_test",
      secureCookies: true,
    });
    expect(readSupabaseAuthEnv(env)?.secureCookies).toBe(false);
  });

  it("하나라도 없거나 DATA_STORE=memory 면 null", () => {
    expect(
      readSupabaseAuthEnv({ ...env, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" }),
    ).toBeNull();
    expect(readSupabaseAuthEnv({ ...env, DATA_STORE: "memory" })).toBeNull();
  });
});

// 인증 서버 응답을 바꿔 가며 "안 된다"(null)와 "답을 못 받았다"(거부)를 나누는지 본다
describe("createSupabaseAuthGateway 응답 구분", () => {
  const respond = (status: number, body: object) =>
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(body, { status })),
    );
  const gateway = () =>
    createSupabaseAuthGateway(
      {
        url: "https://example.supabase.co",
        publishableKey: "sb_publishable_test",
        secureCookies: true,
      },
      createTestCookieJar().jar,
    );
  const credentials = { email: "a@example.com", password: "pw" };

  it("400 invalid_credentials → null", async () => {
    respond(400, { code: "invalid_credentials", msg: "Invalid login" });
    expect(await gateway().signInWithPassword(credentials)).toBeNull();
  });

  it("429 요청 한도, 500 장애 → 거부 (AuthUnavailable 로 바뀐다)", async () => {
    respond(429, { code: "over_request_rate_limit", msg: "slow down" });
    await expect(gateway().signInWithPassword(credentials)).rejects.toThrow(
      /signInWithPassword 실패 \(429/,
    );
    respond(500, { msg: "boom" });
    await expect(gateway().signInWithPassword(credentials)).rejects.toThrow(
      /\(500/,
    );
  });

  it("네트워크 오류 → 거부", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    await expect(gateway().signInWithPassword(credentials)).rejects.toThrow(
      /supabase-auth/,
    );
  });

  it("쿠키에 세션이 없으면 currentUser 는 인증 서버에 묻지 않고 null", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(await gateway().currentUser()).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("role 은 app_metadata 에서만 읽는다 (user_metadata.role 은 무시)", async () => {
    respond(200, {
      access_token: "a",
      refresh_token: "r",
      expires_in: 3600,
      token_type: "bearer",
      user: {
        id: "u1",
        email: "a@example.com",
        app_metadata: {},
        user_metadata: { role: "admin" },
      },
    });
    expect(await gateway().signInWithPassword(credentials)).toEqual({
      id: "u1",
      email: "a@example.com",
      role: undefined,
    });
  });
});
