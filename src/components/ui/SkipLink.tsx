import type { ReactNode } from "react";

type SkipLinkProps = {
  /** 건너뛸 곳. 페이지의 <main id="main"> */
  href?: `#${string}`;
  children: ReactNode;
};

// 건너뛰기 링크: 키보드로 처음 Tab 을 누르면 화면 왼쪽 위에 나타나 머리글과 메뉴를 건너 본문으로 간다 (WCAG 2.4.1).
// 평소에는 보이지 않아 시안 모양은 그대로다. 모양은 primary 버튼과 같은 색
export function SkipLink({ href = "#main", children }: SkipLinkProps) {
  return (
    <a
      href={href}
      // sr-only 상자(1px, 안쪽 여백 0)를 깨지 않게 모양은 모두 포커스 때만 준다
      className={
        "sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 " +
        "focus-visible:rounded-10 focus-visible:bg-purple-55 focus-visible:px-5 focus-visible:py-3.5 focus-visible:text-button focus-visible:text-white " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-70"
      }
    >
      {children}
    </a>
  );
}
