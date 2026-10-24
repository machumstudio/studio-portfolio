import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthGateway } from "@/application/admin-auth/auth-gateway";
import type { AuthenticatedUser } from "@/domain/admin-auth/admin";
import { initialAdminLoginState } from "./form-state";

// container 대신 가짜 AuthGateway 를 꽂는다. redirect 는 Next 처럼 던져서 멈춘다
const deps = vi.hoisted(() => ({
  session: null as AuthenticatedUser | null,
  fail: false,
  signInCalls: 0,
  // 브라우저 쿠키 (proxy 가 로그인 화면에서 넣은 돌아갈 곳)
  cookies: new Map<string, string>(),
}));

class Redirect extends Error {
  constructor(readonly url: string) {
    super(`redirect ${url}`);
  }
}

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = deps.cookies.get(name);
      return value === undefined ? undefined : { name, value };
    },
    delete: ({ name }: { name: string }) => deps.cookies.delete(name),
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Redirect(url);
  },
}));
vi.mock("@/infrastructure/container", () => {
  const accounts = [
    { id: "a1", email: "admin@example.com", role: "admin", password: "pw-a" },
    { id: "e1", email: "editor@example.com", role: "editor", password: "pw-e" },
  ];
  const gateway: AuthGateway = {
    signInWithPassword: async ({ email, password }) => {
      deps.signInCalls++;
      if (deps.fail) throw new Error("auth down");
      const found = accounts.find(
        (a) => a.email === email && a.password === password,
      );
      deps.session = found
        ? { id: found.id, email: found.email, role: found.role }
        : null;
      return deps.session;
    },
    currentUser: async () => deps.session,
    signOut: async () => {
      if (deps.fail) throw new Error("auth down");
      deps.session = null;
    },
  };
  return { container: { adminAuth: { gateway: async () => gateway } } };
});

const { signInAction, signOutAction } = await import("./actions");

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [name, value] of Object.entries(entries)) data.append(name, value);
  return data;
};

const submit = (entries: Record<string, string>) =>
  signInAction(initialAdminLoginState, form(entries));

const redirectOf = async (promise: Promise<unknown>) => {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  if (!(error instanceof Redirect)) throw new Error("redirect 하지 않았다");
  return error.url;
};

beforeEach(() => {
  deps.session = null;
  deps.fail = false;
  deps.signInCalls = 0;
  deps.cookies.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("signInAction", () => {
  it("관리자면 /admin 으로 redirect", async () => {
    expect(
      await redirectOf(
        submit({ email: "admin@example.com", password: "pw-a" }),
      ),
    ).toBe("/admin");
    expect(deps.session?.id).toBe("a1");
  });

  it("돌아갈 곳 쿠키가 /admin 경로면 그곳으로, 바깥 주소면 /admin 으로. 쓴 뒤 지운다", async () => {
    const login = (returnTo: string) => {
      deps.cookies.set("machum-admin-return-to", returnTo);
      return redirectOf(
        submit({ email: "admin@example.com", password: "pw-a" }),
      );
    };
    expect(await login("/admin/works?draft=1")).toBe("/admin/works?draft=1");
    expect(deps.cookies.has("machum-admin-return-to")).toBe(false);
    expect(await login("https://evil.example")).toBe("/admin");
    expect(await login("//evil.example")).toBe("/admin");
  });

  it("폼 칸으로 보낸 next 는 무시한다 (돌아갈 곳은 쿠키만)", async () => {
    expect(
      await redirectOf(
        submit({
          email: "admin@example.com",
          password: "pw-a",
          next: "/admin/works",
        }),
      ),
    ).toBe("/admin");
  });

  it("실패하면 돌아갈 곳 쿠키를 남겨 둔다 (다시 시도할 때 쓴다)", async () => {
    deps.cookies.set("machum-admin-return-to", "/admin/works");
    await submit({ email: "admin@example.com", password: "nope" });
    expect(deps.cookies.get("machum-admin-return-to")).toBe("/admin/works");
  });

  it("틀린 비밀번호, 없는 이메일, 관리자 아님은 같은 invalid. 이메일만 돌려준다", async () => {
    for (const entries of [
      { email: "admin@example.com", password: "nope" },
      { email: "nobody@example.com", password: "pw-a" },
      { email: " editor@example.com ", password: "pw-e" },
    ])
      expect(await submit(entries)).toEqual({
        status: "error",
        code: "invalid",
        email: entries.email.trim(),
      });
    // 관리자가 아닌 계정의 세션은 남지 않는다
    expect(deps.session).toBeNull();
  });

  it("빈 칸 → required, 인증 서비스에 묻지 않는다", async () => {
    expect(await submit({ email: "admin@example.com" })).toEqual({
      status: "error",
      code: "required",
      email: "admin@example.com",
    });
    expect(deps.signInCalls).toBe(0);
  });

  it("인증 서비스 장애 → unavailable, 원인은 서버 로그에만", async () => {
    deps.fail = true;
    expect(
      await submit({ email: "admin@example.com", password: "pw-a" }),
    ).toEqual({
      status: "error",
      code: "unavailable",
      email: "admin@example.com",
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("AuthUnavailable"),
      new Error("auth down"),
    );
  });

  it("칸에 파일이 오면 invalid (인증 서비스에 묻지 않는다)", async () => {
    const data = form({ password: "pw-a" });
    data.append("email", new File(["x"], "x.txt"));
    expect(await signInAction(initialAdminLoginState, data)).toEqual({
      status: "error",
      code: "invalid",
      email: "",
    });
    expect(deps.signInCalls).toBe(0);
  });

  it("서버 로그에 이메일과 비밀번호를 남기지 않는다", async () => {
    deps.fail = true;
    await submit({ email: "admin@example.com", password: "pw-a" });
    const logged = JSON.stringify(
      [vi.mocked(console.error), vi.mocked(console.warn)].flatMap(
        (spy) => spy.mock.calls,
      ),
    );
    expect(logged).not.toContain("admin@example.com");
    expect(logged).not.toContain("pw-a");
  });
});

describe("signOutAction", () => {
  it("세션을 끝내고 로그인 화면으로", async () => {
    deps.session = { id: "a1", email: "admin@example.com", role: "admin" };
    expect(await redirectOf(signOutAction())).toBe("/admin/login");
    expect(deps.session).toBeNull();
  });

  it("인증 서비스 장애여도 로그인 화면으로 (서버 로그에 남김)", async () => {
    deps.fail = true;
    expect(await redirectOf(signOutAction())).toBe("/admin/login");
    expect(console.error).toHaveBeenCalled();
  });
});
