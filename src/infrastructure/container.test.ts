import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

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
