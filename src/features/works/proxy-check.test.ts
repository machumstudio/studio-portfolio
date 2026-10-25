import { beforeEach, describe, expect, it, vi } from "vitest";

// proxy 가 관리자 작업 편집 주소의 작업이 있는지 묻는 입구 (docs/adr/0019)
const deps = vi.hoisted(() => ({
  ids: new Set<string>(),
  fail: false,
  jars: [] as unknown[],
}));

vi.mock("server-only", () => ({}));
vi.mock("@/infrastructure/container", () => ({
  container: {
    works: {
      admin: async (jar: unknown) => {
        deps.jars.push(jar);
        return {
          repo: {
            findById: async (id: string) => {
              if (deps.fail) throw new Error("db down");
              return deps.ids.has(id) ? { id } : null;
            },
          },
        };
      },
    },
  },
}));

const { workExists } = await import("./proxy-check");

const jar: Parameters<typeof workExists>[0] = {
  getAll: () => [],
  setAll: () => {},
};

describe("workExists", () => {
  beforeEach(() => {
    deps.ids = new Set(["work-1"]);
    deps.fail = false;
    deps.jars = [];
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("있으면 true, 없거나 저장할 수 없는 형식의 id 면 false", async () => {
    expect(await workExists(jar, "work-1")).toBe(true);
    expect(await workExists(jar, "work-2")).toBe(false);
    expect(await workExists(jar, "../etc")).toBe(false);
    expect(deps.jars).toEqual([jar, jar, jar]);
  });

  it("저장소 장애면 있다고 보고 페이지에 맡긴다", async () => {
    deps.fail = true;
    expect(await workExists(jar, "work-1")).toBe(true);
    expect(console.error).toHaveBeenCalled();
  });
});
