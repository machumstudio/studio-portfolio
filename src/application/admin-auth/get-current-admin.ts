import {
  authorizeAdmin,
  type Admin,
  type NotAdmin,
} from "@/domain/admin-auth/admin";
import { err, type Result } from "@/shared/result";
import type { AuthGateway } from "./auth-gateway";
import type { AuthUnavailable } from "./sign-in";

export type GetCurrentAdminError =
  { type: "NotSignedIn" } | NotAdmin | AuthUnavailable;

type Deps = { gateway: AuthGateway };

// 지금 요청의 관리자. 관리자 화면(레이아웃, 페이지)과 서버 액션이 데이터에 닿기 전에 부르는 최종 확인이다.
// proxy 의 빠른 확인과 달리 세션을 인증 서비스에서 다시 확인한다. 장애일 때도 관리자로 보지 않는다 (닫힌 쪽으로 실패)
export const getCurrentAdmin =
  ({ gateway }: Deps) =>
  async (): Promise<Result<Admin, GetCurrentAdminError>> => {
    let user;
    try {
      user = await gateway.currentUser();
    } catch (cause) {
      return err({ type: "AuthUnavailable", cause });
    }
    return user ? authorizeAdmin(user) : err({ type: "NotSignedIn" });
  };
