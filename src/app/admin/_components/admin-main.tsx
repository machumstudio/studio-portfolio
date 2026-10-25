"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

// 관리자 본문 틀 <main id="main"> (건너뛰기 링크가 가는 곳).
// 관리자 공통 틀(AdminShell)은 화면마다 그린다 (메뉴의 현재 위치와 새 문의 수를 화면을 그릴 때마다 맞춘다).
// 화면 안 이동 뒤 Next(cacheComponents)는 이전 화면을 숨긴 <Activity> 로 DOM 에 남겨서 id="main" 이 여러 개가 된다.
// 숨겨지면 React 가 effect 를 정리하므로, 그때 id 를 떼고 다시 보이면 붙인다. 서버 HTML(JS 없음)에는 처음부터 있다
export function AdminMain({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const main = ref.current!;
    main.id = "main";
    return () => main.removeAttribute("id");
  }, []);
  return (
    <main ref={ref} id="main" className={className}>
      {children}
    </main>
  );
}
