import type { NextRequest } from "next/server";
import { authorizeAdmin } from "@/domain/admin-auth/admin";
import type { CookieToSet } from "./cookie-jar";
import { memorySessionCookie } from "./in-memory-auth";
import { readAdminAuthMode } from "./mode";
import { createSupabaseCookieClient } from "./supabase-auth-gateway";

export type ProxySessionCheck = {
  /** 빠른 확인 결과. 최종 판단은 서버(requireAdmin)가 다시 한다 */
  looksLikeAdmin: boolean;
  /** 응답에 실을 쿠키 (Supabase 토큰 갱신). 요청 쿠키에는 이미 반영했다 */
  cookies: CookieToSet[];
};

// proxy(src/proxy.ts)의 /admin 빠른 확인. 인증 서버에 묻지 않고 쿠키만 본다 (proxy 는 모든 관리자 요청과 프리페치에서 돈다).
// - Supabase: getClaims 로 JWT 서명과 만료를 확인하고 app_metadata.role 을 본다. 서명 키가 비대칭(JWKS)이면
//   네트워크 없이 확인한다. 액세스 토큰이 만료됐으면 refresh 토큰으로 갱신해 새 쿠키를 응답에 싣는다.
//   서버 컴포넌트는 쿠키를 쓸 수 없어서 갱신은 여기서만 한다 (@supabase/ssr 권장 방식)
// - 인메모리: 세션 쿠키가 있는지만 본다 (토큰이 가리키는 계정은 서버 메모리만 안다)
// - 꺼짐: 항상 관리자 아님
export async function checkProxySession(
  request: NextRequest,
): Promise<ProxySessionCheck> {
  const mode = readAdminAuthMode();
  switch (mode.kind) {
    case "disabled":
      return { looksLikeAdmin: false, cookies: [] };
    case "memory":
      return {
        looksLikeAdmin: request.cookies.has(memorySessionCookie),
        cookies: [],
      };
    case "supabase": {
      const cookies: CookieToSet[] = [];
      const { auth } = createSupabaseCookieClient(mode.env, {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value } of list) request.cookies.set(name, value);
          cookies.push(...list);
        },
      });
      const { data, error } = await auth.getClaims();
      const claims = error ? null : data?.claims;
      const looksLikeAdmin = claims
        ? authorizeAdmin({
            id: claims.sub,
            email: claims.email ?? "",
            role: (claims.app_metadata as { role?: unknown } | undefined)?.role,
          }).ok
        : false;
      return { looksLikeAdmin, cookies };
    }
  }
}
