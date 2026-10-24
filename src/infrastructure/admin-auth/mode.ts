import type { AuthGateway } from "@/application/admin-auth/auth-gateway";
import {
  readSupabaseAuthEnv,
  type SupabaseAuthEnv,
} from "./supabase-auth-gateway";

export type AdminAuthMode =
  | { kind: "supabase"; env: SupabaseAuthEnv }
  | { kind: "memory" }
  | { kind: "disabled" };

type Env = Readonly<Record<string, string | undefined>>;

// 관리자 인증을 무엇으로 할지. container(화면, 액션)와 proxy 가 같은 판단을 쓴다.
// - DATA_STORE=memory: 레포에 비밀번호가 있는 테스트 계정 (e2e). Vercel production 에서는 켜지 않는다
// - Supabase URL + publishable 키: Supabase Auth
// - 둘 다 아니면 꺼짐 (CI 빌드, env 없는 로컬): 누구도 로그인하지 못한다.
//   works/inquiry 와 달리 env 가 없다고 인메모리로 넘어가지 않는다 (테스트 계정이 배포에 켜지지 않게)
export function readAdminAuthMode(env: Env = process.env): AdminAuthMode {
  if (env.DATA_STORE === "memory")
    return env.VERCEL_ENV === "production"
      ? { kind: "disabled" }
      : { kind: "memory" };
  const supabase = readSupabaseAuthEnv(env);
  return supabase ? { kind: "supabase", env: supabase } : { kind: "disabled" };
}

/** 꺼짐 모드: 아무도 로그인하지 못하고 세션도 없다 */
export const disabledAuthGateway: AuthGateway = {
  signInWithPassword: async () => null,
  currentUser: async () => null,
  signOut: async () => {},
};
