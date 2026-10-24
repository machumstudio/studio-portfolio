import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import {
  adminHome,
  adminLoginPath,
  adminLoginUrl,
  returnToCookie,
  safeAdminReturnPath,
} from "./features/admin-auth/return-to";
import { routing } from "./i18n/routing";
import { checkProxySession } from "./infrastructure/admin-auth/proxy-session";

const intl = createMiddleware(routing);

const isAdminPath = (pathname: string) =>
  pathname === "/admin" || pathname.startsWith("/admin/");

// /admin 이하: 언어 처리 없이(한국어만, docs/adr/0013) 관리자 세션을 빠르게 확인한다.
// - 세션이 관리자 같지 않으면 로그인 화면으로 (돌아올 곳은 지금 경로. 로그인 화면이 다시 검사한다)
// - 페이지 이동(GET/HEAD)만 돌려보낸다. 서버 액션(POST)은 액션이 직접 권한을 확인하고 결과를 그리게 둔다
// - 최종 권한 확인은 서버(requireAdmin)가 인증 서버에 다시 한다. 여기는 빠른 확인과 토큰 갱신만
// - 로그인 화면 GET: ?next= 를 검사해서 로그인 액션이 읽을 쿠키로 넘긴다 (화면은 정적으로 둔다, return-to.ts)
// - 모든 관리자 응답에 X-Robots-Tag: noindex
async function adminProxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await checkProxySession(request);
  const isNavigation = request.method === "GET" || request.method === "HEAD";

  const response =
    session.looksLikeAdmin || pathname === adminLoginPath || !isNavigation
      ? NextResponse.next({ request })
      : NextResponse.redirect(
          new URL(adminLoginUrl(`${pathname}${search}`), request.url),
        );
  for (const { name, value, options } of session.cookies)
    response.cookies.set(name, value, options);
  if (pathname === adminLoginPath && isNavigation)
    rememberReturnTo(request, response);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

function rememberReturnTo(request: NextRequest, response: NextResponse) {
  const returnTo = safeAdminReturnPath(
    request.nextUrl.searchParams.get("next"),
  );
  const { name, path, maxAge } = returnToCookie;
  if (returnTo !== adminHome)
    response.cookies.set(name, returnTo, {
      path,
      maxAge,
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  else if (request.cookies.has(name)) response.cookies.delete({ name, path });
}

export default function proxy(request: NextRequest) {
  return isAdminPath(request.nextUrl.pathname)
    ? adminProxy(request)
    : intl(request);
}

export const config = {
  // api, Next 내부 경로, 확장자가 있는 정적 파일은 제외
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
