"use client";

import type { ComponentProps } from "react";
import { Link, usePathname } from "@/i18n/navigation";

type NavLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

// 현재 페이지 링크에 aria-current="page" 를 붙인다. 모양은 사용처에서 aria-[current=page]: 로 준다.
// 하위 경로(/portfolio/... 등)도 그 메뉴를 현재로 본다. 홈(/)은 정확히 같을 때만.
export function NavLink({ href, ...props }: NavLinkProps) {
  const pathname = usePathname();
  const current =
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  return (
    <Link href={href} aria-current={current ? "page" : undefined} {...props} />
  );
}
