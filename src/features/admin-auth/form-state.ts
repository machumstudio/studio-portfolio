import type { SignInError } from "@/application/admin-auth/sign-in";
import { assertNever } from "@/shared/assert-never";

// 화면이 번역할 실패 코드. 메시지 키는 AdminLogin.errors.<code>
// invalid 하나가 없는 이메일, 틀린 비밀번호, 관리자 아님을 모두 덮는다 (계정 존재 여부를 드러내지 않는다)
export type AdminLoginErrorCode = "required" | "invalid" | "unavailable";

// 서버 액션이 돌려주는 폼 상태. 성공하면 상태 대신 redirect 한다.
// 실패할 때는 이메일만 돌려줘 다시 그린다 (비밀번호는 돌려주지 않는다)
export type AdminLoginState =
  | { status: "idle" }
  | { status: "error"; code: AdminLoginErrorCode; email: string };

export const initialAdminLoginState: AdminLoginState = { status: "idle" };

export function toLoginErrorCode(error: SignInError): AdminLoginErrorCode {
  switch (error.type) {
    case "MissingCredentials":
      return "required";
    case "InvalidCredentials":
      return "invalid";
    case "AuthUnavailable":
      return "unavailable";
    default:
      return assertNever(error);
  }
}
