import { err, ok, type Result } from "@/shared/result";
import type { AuthGateway } from "./auth-gateway";
import type { AuthUnavailable } from "./sign-in";

type Deps = { gateway: AuthGateway };

// 로그아웃: 이 기기의 세션만 끝낸다. 실패하면 호출한 쪽이 기록하고, 화면은 그래도 로그인으로 보낸다
export const signOut =
  ({ gateway }: Deps) =>
  async (): Promise<Result<void, AuthUnavailable>> => {
    try {
      await gateway.signOut();
      return ok(undefined);
    } catch (cause) {
      return err({ type: "AuthUnavailable", cause });
    }
  };
