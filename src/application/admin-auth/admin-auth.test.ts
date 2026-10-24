import { describe, expect, it } from "vitest";
import type { AuthenticatedUser } from "@/domain/admin-auth/admin";
import type { Credentials } from "@/domain/admin-auth/credentials";
import type { AuthGateway } from "./auth-gateway";
import { getCurrentAdmin } from "./get-current-admin";
import { signIn } from "./sign-in";
import { signOut } from "./sign-out";

// 포트만 지키는 가짜. application 은 infrastructure 를 import 할 수 없어 여기 둔다.
// 계정 목록과 "지금 세션" 하나를 들고, 호출을 기록한다
type Account = AuthenticatedUser & { password: string };

const admin: Account = {
  id: "admin-1",
  email: "admin@example.com",
  role: "admin",
  password: "correct horse",
};
const editor: Account = {
  id: "editor-1",
  email: "editor@example.com",
  role: "editor",
  password: "editor pass",
};

const fakeGateway = (
  accounts: Account[] = [admin, editor],
  fail?: "signIn" | "currentUser" | "signOut",
) => {
  let session: AuthenticatedUser | null = null;
  const calls: { signIn: Credentials[]; signOut: number } = {
    signIn: [],
    signOut: 0,
  };
  const down = (method: typeof fail) => {
    if (fail === method) throw new Error("auth down");
  };
  const gateway: AuthGateway = {
    signInWithPassword: async (credentials) => {
      calls.signIn.push(credentials);
      down("signIn");
      const found = accounts.find(
        (a) =>
          a.email === credentials.email && a.password === credentials.password,
      );
      if (!found) return null;
      const user: AuthenticatedUser = {
        id: found.id,
        email: found.email,
        role: found.role,
      };
      session = user;
      return user;
    },
    currentUser: async () => {
      down("currentUser");
      return session;
    },
    signOut: async () => {
      calls.signOut++;
      down("signOut");
      session = null;
    },
  };
  return { gateway, calls, session: () => session };
};

describe("signIn", () => {
  it("관리자 이메일/비밀번호 → 관리자, 세션이 남는다", async () => {
    const fake = fakeGateway();
    const result = await signIn(fake)({
      email: " admin@example.com ",
      password: admin.password,
    });
    expect(result).toEqual({
      ok: true,
      value: { id: "admin-1", email: "admin@example.com" },
    });
    expect(fake.calls.signIn).toEqual([
      { email: "admin@example.com", password: admin.password },
    ]);
    expect(fake.session()?.id).toBe("admin-1");
  });

  it("빈 칸 → MissingCredentials, 인증 서비스에 묻지 않는다", async () => {
    const fake = fakeGateway();
    expect(await signIn(fake)({ email: "", password: "x" })).toEqual({
      ok: false,
      error: { type: "MissingCredentials" },
    });
    expect(fake.calls.signIn).toEqual([]);
  });

  it("틀린 비밀번호, 없는 이메일, 한도 초과는 모두 같은 InvalidCredentials", async () => {
    const fake = fakeGateway();
    const results = await Promise.all(
      [
        { email: admin.email, password: "wrong" },
        { email: "nobody@example.com", password: admin.password },
        { email: admin.email, password: "x".repeat(2000) },
      ].map(signIn(fake)),
    );
    for (const result of results)
      expect(result).toEqual({
        ok: false,
        error: { type: "InvalidCredentials" },
      });
    // 한도 초과는 인증 서비스에 보내지 않는다
    expect(fake.calls.signIn).toHaveLength(2);
    expect(fake.session()).toBeNull();
  });

  it("비밀번호는 맞지만 관리자가 아니면 세션을 끝내고 InvalidCredentials", async () => {
    const fake = fakeGateway();
    expect(
      await signIn(fake)({ email: editor.email, password: editor.password }),
    ).toEqual({ ok: false, error: { type: "InvalidCredentials" } });
    expect(fake.calls.signOut).toBe(1);
    expect(fake.session()).toBeNull();
  });

  it("관리자가 아닌 세션을 끝내다 실패해도 InvalidCredentials", async () => {
    const fake = fakeGateway(undefined, "signOut");
    expect(
      await signIn(fake)({ email: editor.email, password: editor.password }),
    ).toEqual({ ok: false, error: { type: "InvalidCredentials" } });
  });

  it("인증 서비스 장애 → AuthUnavailable (원인 포함)", async () => {
    const result = await signIn(fakeGateway(undefined, "signIn"))({
      email: admin.email,
      password: admin.password,
    });
    expect(result).toEqual({
      ok: false,
      error: { type: "AuthUnavailable", cause: new Error("auth down") },
    });
  });
});

describe("getCurrentAdmin", () => {
  it("세션이 없으면 NotSignedIn", async () => {
    expect(await getCurrentAdmin(fakeGateway())()).toEqual({
      ok: false,
      error: { type: "NotSignedIn" },
    });
  });

  it("관리자 세션이면 관리자", async () => {
    const fake = fakeGateway();
    await signIn(fake)({ email: admin.email, password: admin.password });
    expect(await getCurrentAdmin(fake)()).toEqual({
      ok: true,
      value: { id: "admin-1", email: "admin@example.com" },
    });
  });

  it("관리자가 아닌 세션이면 NotAdmin (로그인 화면을 거치지 않고 만든 세션)", async () => {
    const fake = fakeGateway();
    await fake.gateway.signInWithPassword({
      email: editor.email,
      password: editor.password,
    });
    expect(await getCurrentAdmin(fake)()).toEqual({
      ok: false,
      error: { type: "NotAdmin" },
    });
  });

  it("인증 서비스 장애면 관리자로 보지 않는다 (AuthUnavailable)", async () => {
    const result = await getCurrentAdmin(
      fakeGateway(undefined, "currentUser"),
    )();
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.type).toBe("AuthUnavailable");
  });
});

describe("signOut", () => {
  it("세션을 끝낸다. 그 뒤 getCurrentAdmin 은 NotSignedIn", async () => {
    const fake = fakeGateway();
    await signIn(fake)({ email: admin.email, password: admin.password });
    expect(await signOut(fake)()).toEqual({ ok: true, value: undefined });
    expect(await getCurrentAdmin(fake)()).toEqual({
      ok: false,
      error: { type: "NotSignedIn" },
    });
  });

  it("세션이 없어도 성공", async () => {
    expect((await signOut(fakeGateway())()).ok).toBe(true);
  });

  it("인증 서비스 장애 → AuthUnavailable", async () => {
    const result = await signOut(fakeGateway(undefined, "signOut"))();
    expect(!result.ok && result.error.type).toBe("AuthUnavailable");
  });
});
