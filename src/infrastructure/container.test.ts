import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
// 관리자 인증은 요청 쿠키를 읽는다. 테스트에는 요청이 없어서 빈 쿠키로 둔다
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));

// container 는 불러올 때 env 를 읽는다. 매번 모듈을 새로 불러 env 별로 확인한다
const load = async (env: Record<string, string | undefined>) => {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import("./container");
};

const supabaseEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_test",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("container 저장소 선택", () => {
  it("URL 과 secret 키가 있으면 Supabase", async () => {
    expect(
      (await load({ ...supabaseEnv, DATA_STORE: undefined })).dataStore,
    ).toBe("supabase");
  });

  it("DATA_STORE=memory 면 env 가 있어도 인메모리 (e2e)", async () => {
    const { dataStore, container } = await load({
      ...supabaseEnv,
      DATA_STORE: "memory",
    });
    expect(dataStore).toBe("memory");
    expect((await container.workRepository.findAll()).length).toBeGreaterThan(
      0,
    );
  });

  it("env 가 없으면 인메모리 (CI 빌드, 단위 테스트)", async () => {
    expect(
      (
        await load({
          NEXT_PUBLIC_SUPABASE_URL: undefined,
          SUPABASE_SECRET_KEY: undefined,
        })
      ).dataStore,
    ).toBe("memory");
  });
});

const resendEnv = {
  RESEND_API_KEY: "re_test_key",
  INQUIRY_NOTIFY_EMAIL: "admin@example.com",
};

describe("container 알림 선택", () => {
  it("Resend 키와 받는 주소가 있으면 이메일", async () => {
    expect(
      (await load({ ...resendEnv, DATA_STORE: undefined })).notifierKind,
    ).toBe("resend");
  });

  it("하나라도 없으면 로그 (CI, 단위 테스트)", async () => {
    expect(
      (await load({ ...resendEnv, INQUIRY_NOTIFY_EMAIL: undefined }))
        .notifierKind,
    ).toBe("log");
    expect(
      (await load({ ...resendEnv, RESEND_API_KEY: undefined })).notifierKind,
    ).toBe("log");
  });

  it("DATA_STORE=memory(e2e) 면 env 가 있어도 보내지 않는다", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    vi.stubGlobal("fetch", fetch);
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      const { notifierKind, container } = await load({
        ...resendEnv,
        DATA_STORE: "memory",
      });
      expect(notifierKind).toBe("log");
      const { submitInquiry } =
        await import("@/application/inquiry/submit-inquiry");
      const result = await submitInquiry(container.inquiry)({
        firstName: "하늘",
        lastName: "김",
        email: "sky@example.com",
        message: "문의",
      });
      expect(result.ok && result.value.warnings).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      info.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});

const authEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
};

describe("container 관리자 인증 선택", () => {
  it("URL 과 publishable 키가 있으면 Supabase Auth", async () => {
    expect(
      (await load({ ...authEnv, DATA_STORE: undefined })).adminAuthKind,
    ).toBe("supabase");
  });

  it("DATA_STORE=memory 면 테스트 계정 (e2e)", async () => {
    expect(
      (await load({ ...authEnv, DATA_STORE: "memory" })).adminAuthKind,
    ).toBe("memory");
  });

  it("env 가 없으면 인메모리로 넘어가지 않고 꺼진다 (누구도 로그인 못 함)", async () => {
    const { adminAuthKind, container } = await load({
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined,
      DATA_STORE: undefined,
    });
    expect(adminAuthKind).toBe("disabled");
    const gateway = await container.adminAuth.gateway();
    expect(
      await gateway.signInWithPassword({
        email: "admin@example.com",
        password: "memory-admin-password",
      }),
    ).toBeNull();
  });

  it("Vercel production 에서는 DATA_STORE=memory 여도 테스트 계정을 켜지 않는다", async () => {
    expect(
      (await load({ DATA_STORE: "memory", VERCEL_ENV: "production" }))
        .adminAuthKind,
    ).toBe("disabled");
  });
});
