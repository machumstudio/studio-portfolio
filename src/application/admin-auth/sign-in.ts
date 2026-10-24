import { authorizeAdmin, type Admin } from "@/domain/admin-auth/admin";
import {
  parseCredentials,
  type CredentialsInput,
} from "@/domain/admin-auth/credentials";
import { err, type Result } from "@/shared/result";
import type { AuthGateway } from "./auth-gateway";

export type AuthUnavailable = { type: "AuthUnavailable"; cause: unknown };

export type SignInError =
  | { type: "MissingCredentials" }
  /** 이메일 없음, 비밀번호 틀림, 관리자 아님, 한도 초과를 하나로 묶는다 (계정 존재 여부를 드러내지 않는다) */
  | { type: "InvalidCredentials" }
  | AuthUnavailable;

type Deps = { gateway: AuthGateway };

const invalid = err({ type: "InvalidCredentials" } as const);

// 관리자 로그인: 입력 정리 → 비밀번호 확인 → 관리자 판정.
// 비밀번호는 맞지만 관리자가 아닌 사용자는 방금 만든 세션을 끝내고 틀린 비밀번호와 같은 실패로 돌려준다
export const signIn =
  ({ gateway }: Deps) =>
  async (input: CredentialsInput): Promise<Result<Admin, SignInError>> => {
    const credentials = parseCredentials(input);
    if (!credentials.ok)
      return credentials.error.type === "MissingCredentials"
        ? err({ type: "MissingCredentials" })
        : invalid;

    let user;
    try {
      user = await gateway.signInWithPassword(credentials.value);
    } catch (cause) {
      return err({ type: "AuthUnavailable", cause });
    }
    if (!user) return invalid;

    const admin = authorizeAdmin(user);
    if (admin.ok) return admin;
    try {
      await gateway.signOut();
    } catch {
      // 세션을 못 지워도 관리자가 아니라서 proxy 와 서버 확인이 다시 거부한다
    }
    return invalid;
  };
