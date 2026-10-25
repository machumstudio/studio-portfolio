import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import {
  adminHome,
  adminLoginPath,
  adminLoginUrl,
  returnToCookie,
  safeAdminReturnPath,
} from "./features/admin-auth/return-to";
import { inquiryExists } from "./features/inquiry/proxy-check";
import { workExists } from "./features/works/proxy-check";
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
// - 상세 화면(문의, 작업 편집) 문서 요청: 없는 id 면 404 화면으로 rewrite 해서 상태 코드도 404 (docs/adr/0019)
// - 모든 관리자 응답에 X-Robots-Tag: noindex
async function adminProxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await checkProxySession(request);
  const isNavigation = request.method === "GET" || request.method === "HEAD";

  const missing =
    session.looksLikeAdmin && isNavigation
      ? await missingDetailPage(request)
      : null;
  const response = missing
    ? NextResponse.rewrite(new URL(missing, request.url))
    : session.looksLikeAdmin || pathname === adminLoginPath || !isNavigation
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

// 관리자 상세 화면은 PPR 로 응답을 먼저 보내기 시작해서, 페이지의 notFound() 로는 상태 코드가 200 에 머문다.
// 문서 요청(주소창, 새로 고침, 링크를 새 탭으로)에서만 저장소에 있는지 묻고, 없으면 404 로 미리 만들어 둔 화면 주소를 돌려준다.
// 화면 안 이동(RSC 요청, 프리페치)은 상태 코드가 보이지 않으므로 묻지 않는다 (페이지의 notFound() 가 같은 화면을 그린다)
const detailPages = [
  {
    pattern: /^\/admin\/inquiries\/([^/]+)$/,
    exists: inquiryExists,
    missing: "/admin/inquiries/missing",
  },
  {
    pattern: /^\/admin\/works\/(?!new$)([^/]+)$/,
    exists: workExists,
    missing: "/admin/works/missing",
  },
];

async function missingDetailPage(request: NextRequest) {
  if (request.headers.has("rsc")) return null;
  for (const { pattern, exists, missing } of detailPages) {
    const id = pattern.exec(request.nextUrl.pathname)?.[1];
    // missing 은 이미 404 화면이다
    if (id === undefined || id === "missing") continue;
    const cookies = {
      getAll: () => request.cookies.getAll(),
      // 토큰 갱신은 checkProxySession 이 이미 했다
      setAll: () => {},
    };
    const decoded = safeDecode(id);
    return decoded !== null && (await exists(cookies, decoded))
      ? null
      : missing;
  }
  return null;
}

const safeDecode = (segment: string) => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
};

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
