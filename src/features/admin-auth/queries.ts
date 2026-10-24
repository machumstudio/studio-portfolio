import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getCurrentAdmin } from "@/application/admin-auth/get-current-admin";
import type { Admin } from "@/domain/admin-auth/admin";
import { container } from "@/infrastructure/container";
import { adminLoginUrl } from "./return-to";

// 요청 하나에서 레이아웃, 페이지, 컴포넌트가 여러 번 불러도 인증 서버에는 한 번만 묻는다
const currentAdmin = cache(async () => {
  const result = await getCurrentAdmin({
    gateway: await container.adminAuth.gateway(),
  })();
  if (!result.ok && result.error.type === "AuthUnavailable")
    console.error(
      "[admin-auth] AuthUnavailable: 세션을 확인하지 못해 관리자로 보지 않았다",
      result.error.cause,
    );
  return result.ok ? result.value : null;
});

/**
 * 관리자 화면의 최종 권한 확인. 관리자가 아니면 로그인 화면으로 보낸다 (돌아올 곳: returnTo).
 * proxy 는 쿠키만 빠르게 보고, 여기서 인증 서버에 세션을 다시 확인한다.
 * 레이아웃은 같은 레이아웃 안에서 페이지를 옮길 때 다시 그려지지 않으므로 페이지와 서버 액션마다 부른다
 */
export async function requireAdmin(returnTo: string): Promise<Admin> {
  const admin = await currentAdmin();
  if (!admin) redirect(adminLoginUrl(returnTo));
  return admin;
}
