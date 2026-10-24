"use server";

import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/application/admin-auth/sign-in";
import { signOut } from "@/application/admin-auth/sign-out";
import { container } from "@/infrastructure/container";
import { toLoginErrorCode, type AdminLoginState } from "./form-state";
import {
  adminLoginPath,
  returnToCookie,
  safeAdminReturnPath,
} from "./return-to";
import { parseLoginForm } from "./schema";

const gateway = async () => ({ gateway: await container.adminAuth.gateway() });

// 관리자 로그인. useActionState 로 부르고, JS 가 없을 때는 일반 POST 로 같은 함수가 불린다.
// 성공하면 세션 쿠키를 응답에 싣고 돌아갈 곳(같은 사이트 /admin 경로만)으로 303 redirect.
// 돌아갈 곳은 proxy 가 로그인 화면에서 넣어 둔 쿠키(returnToCookie)에서 읽고, 쓴 뒤 지운다.
// 서버 로그에는 실패 종류만 남긴다 (이메일, 비밀번호는 남기지 않는다).
// 다른 사이트에서 보낸 POST 는 Next 가 Origin 과 Host 를 비교해 서버 액션을 실행하지 않는다
export async function signInAction(
  _previous: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const parsed = parseLoginForm(formData);
  if (!parsed.ok) {
    console.warn("[admin-auth] 폼 형태가 아닌 로그인 요청을 거절했다");
    return { status: "error", code: "invalid", email: "" };
  }
  const { email, password } = parsed.value;

  const result = await signIn(await gateway())({ email, password });
  if (!result.ok) {
    if (result.error.type === "AuthUnavailable")
      console.error(
        "[admin-auth] AuthUnavailable: 로그인 중 인증 서비스에 닿지 못했다",
        result.error.cause,
      );
    return {
      status: "error",
      code: toLoginErrorCode(result.error),
      email: email.trim(),
    };
  }
  const store = await cookies();
  const returnTo = safeAdminReturnPath(store.get(returnToCookie.name)?.value);
  store.delete({ name: returnToCookie.name, path: returnToCookie.path });
  redirect(returnTo);
}

// 로그아웃. 이 기기 세션만 끝내고 로그인 화면으로. 인증 서비스 호출이 실패해도 쿠키는 지워지고 로그인으로 간다
export async function signOutAction(): Promise<void> {
  const result = await signOut(await gateway())();
  if (!result.ok)
    console.error(
      "[admin-auth] AuthUnavailable: 로그아웃 중 인증 서비스에 닿지 못했다",
      result.error.cause,
    );
  redirect(adminLoginPath);
}
