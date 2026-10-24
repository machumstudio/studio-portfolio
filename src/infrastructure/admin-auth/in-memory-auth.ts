import type { AuthGateway } from "@/application/admin-auth/auth-gateway";
import type { AuthenticatedUser } from "@/domain/admin-auth/admin";
import { adminCookieOptions, type CookieJar } from "./cookie-jar";

export type MemoryAccount = AuthenticatedUser & { password: string };

/** 인메모리 세션 쿠키 이름. proxy 의 빠른 확인도 이 이름을 본다 */
export const memorySessionCookie = "machum-admin-session";

// 인메모리 인증 (단위 테스트, DATA_STORE=memory 인 e2e). 계정과 세션을 서버 프로세스 메모리에 둔다.
// 세션 쿠키에는 추측할 수 없는 토큰만 넣고, 그 토큰이 가리키는 계정은 서버만 안다 (위조 쿠키는 세션이 아니다).
// 서버가 다시 뜨면 세션은 모두 사라진다
export function createInMemoryAuth(accounts: readonly MemoryAccount[]) {
  const sessions = new Map<string, string>();

  const toUser = ({ id, email, role }: MemoryAccount): AuthenticatedUser => ({
    id,
    email,
    role,
  });
  const tokenOf = (jar: CookieJar) =>
    jar.getAll().find((cookie) => cookie.name === memorySessionCookie)?.value;
  const clear = (jar: CookieJar) => {
    const token = tokenOf(jar);
    if (token) sessions.delete(token);
    jar.setAll([
      {
        name: memorySessionCookie,
        value: "",
        options: { ...adminCookieOptions(false), maxAge: 0 },
      },
    ]);
  };

  const gateway = (jar: CookieJar): AuthGateway => ({
    signInWithPassword: async ({ email, password }) => {
      const account = accounts.find(
        (a) =>
          a.email.toLowerCase() === email.toLowerCase() &&
          a.password === password,
      );
      if (!account) return null;
      const token = crypto.randomUUID();
      sessions.set(token, account.id);
      jar.setAll([
        {
          name: memorySessionCookie,
          value: token,
          options: adminCookieOptions(false),
        },
      ]);
      return toUser(account);
    },
    currentUser: async () => {
      const token = tokenOf(jar);
      const id = token ? sessions.get(token) : undefined;
      const account = accounts.find((a) => a.id === id);
      return account ? toUser(account) : null;
    },
    signOut: async () => clear(jar),
  });

  return { gateway };
}
