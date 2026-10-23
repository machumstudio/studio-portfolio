import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import ko from "../../../messages/ko.json";
import { PortfolioFilter } from "./PortfolioFilter";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, scroll, ...props }: { href: string; scroll?: boolean }) => (
    <a href={href} data-scroll={String(scroll)} {...props} />
  ),
}));

const categories = ["portrait", "events", "commercial"];

const renderFilter = (selected: string | null, locale: "ko" | "en" = "ko") =>
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "ko" ? ko : en}
    >
      <PortfolioFilter categories={categories} selected={selected} />
    </NextIntlClientProvider>,
  );

describe("PortfolioFilter", () => {
  it("라벨로 이름 붙은 nav 안에 전체 + 카테고리 링크가 ?category= 주소로 있다", () => {
    renderFilter(null);
    const nav = screen.getByRole("navigation", { name: "분야별로 보기" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
      ["전체", "/portfolio"],
      ["인물", "/portfolio?category=portrait"],
      ["이벤트", "/portfolio?category=events"],
      ["광고", "/portfolio?category=commercial"],
    ]);
  });

  it("고른 것 하나만 aria-current=page, 없으면 전체가 현재다", () => {
    const current = () =>
      screen
        .getAllByRole("link")
        .filter((a) => a.getAttribute("aria-current") === "page")
        .map((a) => a.textContent);
    const { unmount } = renderFilter(null);
    expect(current()).toEqual(["전체"]);
    unmount();
    renderFilter("events");
    expect(current()).toEqual(["이벤트"]);
  });

  it("같은 페이지 안 이동이라 스크롤을 맨 위로 올리지 않는다", () => {
    renderFilter(null);
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("data-scroll", "false");
    }
  });

  it("영어 이름", () => {
    renderFilter("commercial", "en");
    expect(screen.getByRole("link", { name: "Commercial" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
