import type { AuthenticatedUser } from "@/domain/admin-auth/admin";
import type { Credentials } from "@/domain/admin-auth/credentials";

// 인증 서비스 포트. 구현: infrastructure/admin-auth (Supabase 쿠키 세션, 인메모리).
// 두 구현은 infrastructure/admin-auth/auth-gateway.contract.ts 를 같이 통과해야 한다.
// 구현 하나는 요청 하나의 세션(쿠키)에 묶인다. 세션을 어디에 두는지(쿠키 이름, 토큰 갱신)는 구현이 정한다.
// 인증 서비스 장애(네트워크, 5xx, 요청 한도)는 Promise 거부로 알린다. 유스케이스가 Result 에러로 바꾼다
export type AuthGateway = {
  /**
   * 이메일과 비밀번호를 확인하고, 맞으면 이 요청에 세션을 만든다.
   * 이메일이 없거나 비밀번호가 틀리면 null (어느 쪽인지 구분하지 않는다)
   */
  signInWithPassword(
    credentials: Credentials,
  ): Promise<AuthenticatedUser | null>;
  /** 이 요청의 세션을 인증 서비스에서 확인한 사용자. 세션이 없거나 만료/폐기됐으면 null */
  currentUser(): Promise<AuthenticatedUser | null>;
  /** 이 요청의 세션만 끝낸다 (다른 기기의 세션은 그대로). 세션이 없어도 성공 */
  signOut(): Promise<void>;
};
