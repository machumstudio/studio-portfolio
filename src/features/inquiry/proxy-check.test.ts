import { beforeEach, describe, expect, it, vi } from "vitest";

// proxy 가 관리자 문의 상세 주소의 문의가 있는지 묻는 입구 (docs/adr/0019).
// container 대신 쿠키 묶음을 기록하는 가짜 저장소를 꽂는다
const deps = vi.hoisted(() => ({
  ids: new Set<string>(),
  fail: false,
  jars: [] as unknown[],
}));

vi.mock("server-only", () => ({}));
vi.mock("@/infrastructure/container", () => ({
  container: {
    inquiry: {
      admin: async (jar: unknown) => {
        deps.jars.push(jar);
        return {
          findById: async (id: string) => {
            if (deps.fail) throw new Error("db down");
            return deps.ids.has(id) ? { id } : null;
          },
        };
      },
    },
  },
}));

const { inquiryExists } = await import("./proxy-check");

const jar: Parameters<typeof inquiryExists>[0] = {
  getAll: () => [],
  setAll: () => {},
};

describe("inquiryExists", () => {
  beforeEach(() => {
    deps.ids = new Set(["i-1"]);
    deps.fail = false;
    deps.jars = [];
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("있으면 true, 없거나 빈 id 면 false", async () => {
    expect(await inquiryExists(jar, "i-1")).toBe(true);
    expect(await inquiryExists(jar, "i-2")).toBe(false);
    expect(await inquiryExists(jar, " ")).toBe(false);
  });

  it("proxy 의 요청 쿠키로 관리자 저장소를 연다", async () => {
    await inquiryExists(jar, "i-1");
    expect(deps.jars).toEqual([jar]);
  });

  it("저장소 장애면 있다고 보고 페이지에 맡긴다 (로그에는 id 만)", async () => {
    deps.fail = true;
    expect(await inquiryExists(jar, "i-1")).toBe(true);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("문의 i-1"),
      expect.any(Error),
    );
  });
});
