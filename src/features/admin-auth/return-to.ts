/** 로그인 뒤 기본으로 가는 곳 */
export const adminHome = "/admin";
export const adminLoginPath = "/admin/login";

// 판정용 가짜 출처. 상대 경로를 이 출처에 붙여 풀었을 때 출처가 바뀌면 바깥 주소다
const base = "https://admin.invalid";

/**
 * 로그인 뒤 돌아갈 주소(?next=). 같은 사이트의 /admin 아래 경로만 허용하고, 아니면 /admin.
 * - 바깥 주소: https://evil.example, //evil.example, /\evil.example, javascript:...
 * - 브라우저가 지우는 제어 문자(탭, 줄바꿈)와 역슬래시가 든 값은 풀기 전에 거부한다 (/\t/evil.example 등)
 * - 경로는 URL 로 풀어 정규화한 값을 돌려준다 (/admin/../evil 은 /evil 이 되어 거부)
 * - 로그인 화면 자신은 제외한다 (로그인 → 로그인 반복)
 */
export function safeAdminReturnPath(raw: unknown): string {
  if (typeof raw !== "string" || raw === "") return adminHome;
  if (!raw.startsWith("/") || /[\\\u0000-\u001f\u007f]/.test(raw))
    return adminHome;
  let url: URL;
  try {
    url = new URL(raw, base);
  } catch {
    return adminHome;
  }
  if (url.origin !== base) return adminHome;
  const { pathname } = url;
  const underAdmin =
    pathname === adminHome || pathname.startsWith(`${adminHome}/`);
  const isLogin =
    pathname === adminLoginPath || pathname.startsWith(`${adminLoginPath}/`);
  return underAdmin && !isLogin
    ? `${pathname}${url.search}${url.hash}`
    : adminHome;
}

/**
 * 로그인 화면이 ?next= 를 넘겨받는 쿠키. proxy 가 로그인 화면 GET 에서 검사한 값을 넣고, 로그인 액션이 읽고 지운다.
 * 로그인 화면이 요청 값(searchParams, 쿠키)을 읽으면 동적 화면이 되는데, 동적 화면에서는 JS 없는 제출 뒤
 * useActionState 결과가 다시 그려지지 않는다 (Next 16.4 + cacheComponents, docs/adr/0013). 그래서 화면은 정적으로 두고 값은 쿠키로 옮긴다
 */
export const returnToCookie = {
  name: "machum-admin-return-to",
  path: adminLoginPath,
  maxAge: 60 * 10,
} as const;

/** 로그인 화면 주소. 돌아갈 곳이 기본(/admin)이면 next 를 붙이지 않는다 */
export function adminLoginUrl(returnTo: string): string {
  const next = safeAdminReturnPath(returnTo);
  return next === adminHome
    ? adminLoginPath
    : `${adminLoginPath}?next=${encodeURIComponent(next)}`;
}
