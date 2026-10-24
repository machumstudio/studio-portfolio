import "server-only";
import { cookies } from "next/headers";
import type { CookieJar } from "./cookie-jar";

// 서버 컴포넌트, 서버 액션의 요청 쿠키.
// 서버 컴포넌트에서는 쿠키를 쓸 수 없어(Next 가 던진다) 무시한다. 토큰 갱신은 proxy 가 응답 쿠키로 한다.
// 서버 액션(로그인, 로그아웃)에서는 그대로 응답 쿠키가 된다
export async function nextCookieJar(): Promise<CookieJar> {
  const store = await cookies();
  return {
    getAll: () => store.getAll(),
    setAll: (list) => {
      try {
        for (const { name, value, options } of list)
          store.set(name, value, options);
      } catch {
        // 서버 컴포넌트 렌더 중
      }
    },
  };
}
