import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedUser } from "@/domain/admin-auth/admin";

const deps = vi.hoisted(() => ({
  user: null as AuthenticatedUser | null,
  fail: false,
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect ${url}`);
  },
}));
// React cache 는 서버 컴포넌트 렌더 밖에서는 캐시하지 않는다 (테스트마다 새로 묻는다)
vi.mock("@/infrastructure/container", () => ({
  container: {
    adminAuth: {
      gateway: async () => ({
        signInWithPassword: async () => null,
        currentUser: async () => {
          if (deps.fail) throw new Error("auth down");
          return deps.user;
        },
        signOut: async () => {},
      }),
    },
  },
}));

const { requireAdmin } = await import("./queries");

describe("requireAdmin", () => {
  it("관리자면 관리자를 돌려준다", async () => {
    deps.user = { id: "a1", email: "admin@example.com", role: "admin" };
    await expect(requireAdmin("/admin")).resolves.toEqual({
      id: "a1",
      email: "admin@example.com",
    });
  });

  it("세션 없음, 관리자 아님, 장애는 모두 로그인으로 (돌아올 곳 포함)", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const [user, fail] of [
      [null, false],
      [{ id: "e1", email: "editor@example.com", role: "editor" }, false],
      [{ id: "a1", email: "admin@example.com", role: "admin" }, true],
    ] as const) {
      deps.user = user;
      deps.fail = fail;
      await expect(requireAdmin("/admin/works")).rejects.toThrow(
        "redirect /admin/login?next=%2Fadmin%2Fworks",
      );
    }
    expect(error).toHaveBeenCalledTimes(1);
    deps.fail = false;
  });
});
