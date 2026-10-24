import "server-only";
import { createServerClient } from "@supabase/ssr";
import {
  isAuthApiError,
  isAuthSessionMissingError,
  type AuthError,
  type User,
} from "@supabase/supabase-js";
import type { AuthGateway } from "@/application/admin-auth/auth-gateway";
import type { AuthenticatedUser } from "@/domain/admin-auth/admin";
import type { Database } from "../supabase/database";
import { adminCookieOptions, type CookieJar } from "./cookie-jar";

/** 로그인에 쓰는 접속 정보. 사용자 세션으로 동작하므로 secret 키가 아니라 publishable 키다 */
export type SupabaseAuthEnv = {
  url: string;
  publishableKey: string;
  /** 쿠키 Secure 속성. 배포(https)에서는 true */
  secureCookies: boolean;
};

type Env = Readonly<Record<string, string | undefined>>;

// 값이 하나라도 없거나 DATA_STORE=memory 면 null
export function readSupabaseAuthEnv(
  env: Env = process.env,
): SupabaseAuthEnv | null {
  if (env.DATA_STORE === "memory") return null;
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return url && publishableKey
    ? { url, publishableKey, secureCookies: env.NODE_ENV === "production" }
    : null;
}

// 요청 하나의 쿠키에 세션을 두는 Supabase 클라이언트 (@supabase/ssr). proxy 도 같은 설정으로 만든다
export const createSupabaseCookieClient = (
  { url, publishableKey, secureCookies }: SupabaseAuthEnv,
  jar: CookieJar,
) =>
  createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (cookies) => jar.setAll(cookies),
    },
    cookieOptions: adminCookieOptions(secureCookies),
  });

// role 은 app_metadata 에서만 읽는다. user_metadata 는 사용자가 updateUser 로 고칠 수 있다
const toUser = (user: User): AuthenticatedUser => ({
  id: user.id,
  email: user.email ?? "",
  role: (user.app_metadata as { role?: unknown }).role,
});

// 인증 서비스가 "이 요청은 안 된다"고 답한 것(4xx: 틀린 비밀번호, 만료/폐기/위조 토큰, 없는 사용자)과
// 답을 못 받은 것(네트워크, 5xx, 429 요청 한도)을 나눈다. 앞의 것은 null, 뒤의 것은 거부(AuthUnavailable)
const isRejection = (error: AuthError) =>
  isAuthSessionMissingError(error) ||
  (isAuthApiError(error) &&
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== 429);

const unavailable = (action: string, error: AuthError) =>
  new Error(
    `[supabase-auth] ${action} 실패 (${error.status ?? "?"} ${error.code ?? error.name})`,
    { cause: error },
  );

export function createSupabaseAuthGateway(
  env: SupabaseAuthEnv,
  jar: CookieJar,
): AuthGateway {
  const { auth } = createSupabaseCookieClient(env, jar);
  return {
    signInWithPassword: async ({ email, password }) => {
      const { data, error } = await auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (isRejection(error)) return null;
        throw unavailable("signInWithPassword", error);
      }
      return toUser(data.user);
    },
    // getUser 는 토큰을 인증 서버에 보내 확인한다 (폐기된 세션, 지운 사용자, 바뀐 app_metadata 를 안다)
    currentUser: async () => {
      const { data, error } = await auth.getUser();
      if (error) {
        if (isRejection(error)) return null;
        throw unavailable("getUser", error);
      }
      return toUser(data.user);
    },
    // scope local: 이 기기 세션만 끝낸다. 인증 서버 호출이 실패해도 쿠키는 지운다
    signOut: async () => {
      const { error } = await auth.signOut({ scope: "local" });
      if (error && !isRejection(error)) throw unavailable("signOut", error);
    },
  };
}
