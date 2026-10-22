import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/ko.json";
import { SiteHeader } from "./SiteHeader";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => pathname.current,
  Link: ({ href, ...props }: { href: string }) => <a href={href} {...props} />,
}));

const renderHeader = () =>
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <SiteHeader />
    </NextIntlClientProvider>,
  );

describe("SiteHeader", () => {
  beforeEach(() => {
    pathname.current = "/";
  });

  it("로고는 홈 링크이고 이름은 Machum Studio 다", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: "Machum Studio" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("데스크톱 메뉴 4개와 문의 버튼을 보여주고 현재 페이지에 aria-current 를 붙인다", () => {
    pathname.current = "/portfolio";
    renderHeader();
    const nav = screen.getByRole("navigation", { name: "주요 메뉴" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual([
      "홈",
      "소개",
      "포트폴리오",
      "서비스",
    ]);
    expect(
      links.filter((a) => a.getAttribute("aria-current") === "page"),
    ).toEqual([within(nav).getByRole("link", { name: "포트폴리오" })]);
    expect(screen.getByRole("link", { name: "문의하기" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  it("모바일 메뉴를 열면 같은 메뉴와 현재 표시가 보이고 Esc 로 닫힌다", async () => {
    const user = userEvent.setup();
    pathname.current = "/services";
    renderHeader();
    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));

    const [, mobileNav] = screen.getAllByRole("navigation", {
      name: "주요 메뉴",
    });
    expect(
      within(mobileNav).getByRole("link", { name: "서비스" }),
    ).toHaveAttribute("aria-current", "page");
    expect(within(mobileNav).getByRole("link", { name: "홈" })).toHaveFocus();
    expect(
      within(mobileNav).getByRole("link", { name: "문의하기" }),
    ).toHaveAttribute("href", "/contact");

    await user.keyboard("{Escape}");
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveFocus();
  });
});
