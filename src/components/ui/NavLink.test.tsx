import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NavLink } from "./NavLink";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => pathname.current,
  Link: ({ href, ...props }: { href: string }) => <a href={href} {...props} />,
}));

const renderNav = () =>
  render(
    <nav>
      <NavLink href="/">홈</NavLink>
      <NavLink href="/portfolio">포트폴리오</NavLink>
      <NavLink href="/services">서비스</NavLink>
    </nav>,
  );

describe("NavLink", () => {
  beforeEach(() => {
    pathname.current = "/";
  });

  it("현재 경로와 같은 링크에만 aria-current=page 를 붙인다", () => {
    pathname.current = "/services";
    renderNav();
    expect(screen.getByRole("link", { name: "서비스" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    for (const name of ["홈", "포트폴리오"]) {
      expect(screen.getByRole("link", { name })).not.toHaveAttribute(
        "aria-current",
      );
    }
  });

  it("하위 경로도 그 메뉴를 현재로 보지만, 홈은 정확히 / 일 때만이다", () => {
    pathname.current = "/portfolio/wedding-in-seoul";
    renderNav();
    expect(screen.getByRole("link", { name: "포트폴리오" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "홈" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("비슷한 접두사(/services-old)는 현재로 보지 않는다", () => {
    pathname.current = "/services-old";
    renderNav();
    expect(screen.getByRole("link", { name: "서비스" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
