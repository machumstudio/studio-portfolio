import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/ko.json";
import { SiteFooter } from "./SiteFooter";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: { href: string }) => <a href={href} {...props} />,
}));

const renderFooter = () =>
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <SiteFooter cta={<p>CTA 자리</p>} year={2026} />
    </NextIntlClientProvider>,
  );

describe("SiteFooter", () => {
  it("contentinfo 안에 CTA 슬롯과 촬영 분야 마키를 둔다", () => {
    renderFooter();
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText("CTA 자리")).toBeInTheDocument();
    expect(
      within(footer).getByRole("list", { name: "촬영 분야" }),
    ).toBeInTheDocument();
  });

  it("링크 4열은 제목으로 이름 붙은 목록이다", () => {
    renderFooter();
    const nav = screen.getByRole("navigation", { name: "사이트 링크" });
    const headings = within(nav).getAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual([
      "홈",
      "클라이언트",
      "포트폴리오",
      "서비스",
    ]);
    const portfolio = within(nav).getByRole("list", { name: "포트폴리오" });
    expect(within(portfolio).getAllByRole("link")).toHaveLength(5);
    expect(
      within(portfolio).getByRole("link", { name: "웨딩" }),
    ).toHaveAttribute("href", "/portfolio?category=wedding");
  });

  it("소셜 링크는 이름이 있고 새 탭으로 안전하게 연다", () => {
    renderFooter();
    const socials = screen.getByRole("list", { name: "소셜 미디어" });
    const links = within(socials).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("aria-label"))).toEqual([
      "Instagram (새 탭에서 열림)",
      "Facebook (새 탭에서 열림)",
      "X (새 탭에서 열림)",
    ]);
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("저작권, 약관 링크, 시안 크레딧(CC BY 4.0)을 보여준다", () => {
    renderFooter();
    expect(
      screen.getByText("© 2026 Machum Studio. All rights reserved."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "이용약관" })).toHaveAttribute(
      "href",
      "/terms",
    );
    expect(
      screen.getByRole("link", { name: /Design by Produce UI \(CC BY 4\.0\)/ }),
    ).toHaveAttribute(
      "href",
      "https://www.figma.com/community/file/1324089527430438614",
    );
  });

  it("큰 워드마크는 장식이라 보조기기에서 숨긴다", () => {
    renderFooter();
    expect(screen.getByText("Machum")).toHaveAttribute("aria-hidden", "true");
  });
});
