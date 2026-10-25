import { beforeEach, describe, expect, it, vi } from "vitest";

// GET /api/keepalive 의 입구: Vercel cron 이 하루 한 번 저장소를 읽어 Supabase 일시정지를 막는다
const deps = vi.hoisted(() => ({
  store: "supabase" as "supabase" | "memory",
  reads: 0,
  fail: false,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/infrastructure/container", () => ({
  get dataStore() {
    return deps.store;
  },
  container: {
    workRepository: {
      findAll: async () => {
        deps.reads += 1;
        if (deps.fail) throw new Error("db paused");
        return [
          { slug: "a", date: "2024-01", published: true },
          { slug: "b", date: "2024-02", published: false },
        ];
      },
    },
  },
}));

const { keepStoreAwake } = await import("./routes");

const request = (authorization?: string) =>
  new Request("https://machum.example/api/keepalive", {
    headers: authorization ? { authorization } : {},
  });

describe("keepStoreAwake", () => {
  beforeEach(() => {
    deps.store = "supabase";
    deps.reads = 0;
    deps.fail = false;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("저장소를 실제로 한 번 읽고 공개 작업 수를 돌려준다. 캐시하지 않는다", async () => {
    const response = await keepStoreAwake(request(), {});
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      ok: true,
      store: "supabase",
      works: 1,
    });
    expect(deps.reads).toBe(1);
  });

  it("CRON_SECRET 이 있으면 Bearer 값이 같을 때만 읽는다", async () => {
    const env = { CRON_SECRET: "s3cret" };
    expect((await keepStoreAwake(request(), env)).status).toBe(401);
    expect((await keepStoreAwake(request("Bearer nope"), env)).status).toBe(
      401,
    );
    expect(deps.reads).toBe(0);
    expect((await keepStoreAwake(request("Bearer s3cret"), env)).status).toBe(
      200,
    );
    expect(deps.reads).toBe(1);
  });

  it("읽기에 실패하면 503 과 서버 로그 (cron 기록에서 실패로 보이게)", async () => {
    deps.fail = true;
    const response = await keepStoreAwake(request(), {});
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, store: "supabase" });
    expect(console.error).toHaveBeenCalledOnce();
  });

  it("인메모리 저장소면 읽지 않고 200", async () => {
    deps.store = "memory";
    const response = await keepStoreAwake(request(), {});
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, store: "memory" });
    expect(deps.reads).toBe(0);
  });
});
