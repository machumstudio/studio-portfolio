import type { Brand } from "@/shared/brand";
import { err, ok, type Result } from "@/shared/result";

export type AdminId = Brand<string, "AdminId">;

/** 관리자 화면을 쓸 수 있다고 판정된 사용자 */
export type Admin = {
  readonly id: AdminId;
  readonly email: string;
};

/** 관리자 권한을 나타내는 역할 이름. Supabase Auth 의 app_metadata.role 에 둔다 */
export const adminRole = "admin";

/**
 * 인증 서비스가 확인해 준 사용자 (비밀번호 확인 또는 세션 검증을 통과한 뒤).
 * role 은 사용자가 스스로 고칠 수 없는 곳(Supabase 의 app_metadata)에서 온 값이어야 한다.
 * user_metadata 처럼 사용자가 바꿀 수 있는 값을 넣으면 누구나 관리자가 된다
 */
export type AuthenticatedUser = {
  readonly id: string;
  readonly email: string;
  readonly role: unknown;
};

export type NotAdmin = { type: "NotAdmin" };

// 관리자 판정: 역할이 정확히 "admin" 인 사용자만. 대소문자, 앞뒤 공백, 배열/객체 같은 다른 모양은 모두 거부한다.
// 역할이 없거나 모르는 값이면 거부가 기본이다 (허용 목록)
export const authorizeAdmin = (
  user: AuthenticatedUser,
): Result<Admin, NotAdmin> =>
  user.role === adminRole && user.id !== ""
    ? ok({ id: user.id as AdminId, email: user.email })
    : err({ type: "NotAdmin" });
