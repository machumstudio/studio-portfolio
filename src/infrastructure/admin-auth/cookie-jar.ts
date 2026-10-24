import type { CookieOptions } from "@supabase/ssr";

export type { CookieOptions };

export type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

// AuthGateway 구현이 세션을 읽고 쓰는 곳. 요청 하나의 쿠키다.
// 앱: next/headers 의 cookies() (next-cookie-jar.ts), proxy: NextRequest/NextResponse, 테스트: createTestCookieJar
export type CookieJar = {
  getAll(): { name: string; value: string }[];
  setAll(cookies: CookieToSet[]): void;
};

// 관리자 세션 쿠키 공통 속성. 관리자 경로에만 보내고(path), 스크립트에서 읽지 못하게 한다(httpOnly).
// 브라우저용 Supabase 클라이언트를 쓰지 않으므로 httpOnly 로 둘 수 있다
export const adminCookieOptions = (secure: boolean): CookieOptions => ({
  path: "/admin",
  httpOnly: true,
  sameSite: "lax",
  secure,
});

/** 브라우저 하나를 흉내 내는 쿠키 저장소 (단위/계약 테스트). 만료(maxAge 0)나 빈 값은 지운다 */
export function createTestCookieJar(
  initial: { name: string; value: string }[] = [],
) {
  const store = new Map(initial.map(({ name, value }) => [name, value]));
  const jar: CookieJar = {
    getAll: () => [...store].map(([name, value]) => ({ name, value })),
    setAll: (cookies) => {
      for (const { name, value, options } of cookies)
        if (value === "" || options.maxAge === 0) store.delete(name);
        else store.set(name, value);
    },
  };
  return { jar, snapshot: () => jar.getAll() };
}
