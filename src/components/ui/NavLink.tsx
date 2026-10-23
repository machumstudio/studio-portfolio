"use client";

import type { ComponentProps } from "react";
import { Link, usePathname } from "@/i18n/navigation";

type NavLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  /** 이 메뉴를 현재로 보는 경로 접두사들. 기본은 href 하나 (예: 포트폴리오는 /work 도) */
  match?: readonly string[];
};

// 접두사 아래 경로(/portfolio, /portfolio/...)면 true. 비슷한 이름(/portfolio-old)은 아니다.
// 홈(/)은 모든 경로의 접두사라 정확히 같을 때만.
const isUnder = (pathname: string, prefix: string) =>
  prefix === "/"
    ? pathname === "/"
    : pathname === prefix || pathname.startsWith(`${prefix}/`);

// 현재 페이지 링크에 aria-current="page" 를 붙인다. 모양은 사용처에서 aria-[current=page]: 로 준다.
export function NavLink({ href, match = [href], ...props }: NavLinkProps) {
  const pathname = usePathname();
  const current = match.some((prefix) => isUnder(pathname, prefix));
  return (
    <Link href={href} aria-current={current ? "page" : undefined} {...props} />
  );
}
