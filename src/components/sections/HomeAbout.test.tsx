import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/ko.json";
import { HomeAbout } from "./HomeAbout";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: { href: string }) => <a href={href} {...props} />,
}));

const renderAbout = () =>
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <HomeAbout
        photo={{ src: "/images/placeholder.svg", alt: "스튜디오 사진" }}
        email="hello@example.com"
        phone="+00 000000000"
      />
    </NextIntlClientProvider>,
  );

describe("HomeAbout", () => {
  it("제목으로 이름 붙은 섹션이고 소개 페이지로 가는 링크가 있다", () => {
    renderAbout();
    const section = screen.getByRole("region", { name: "마춤 스튜디오입니다" });
    expect(
      within(section).getByRole("link", { name: "더 알아보기" }),
    ).toHaveAttribute("href", "/about");
  });

  it("소개와 연락처는 카드 안 소제목(h3)으로 나뉜다", () => {
    renderAbout();
    expect(
      screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent),
    ).toEqual(["소개", "연락처"]);
    expect(screen.getByRole("region", { name: "소개" })).toHaveTextContent(
      messages.About.intro.body,
    );
  });

  it("연락처는 라벨-값 목록이고 값은 메일/전화 링크다", () => {
    renderAbout();
    const contact = screen.getByRole("region", { name: "연락처" });
    expect(
      within(contact)
        .getAllByRole("term")
        .map((dt) => dt.textContent),
    ).toEqual(["이메일", "전화번호"]);
    expect(
      within(contact).getByRole("link", { name: "hello@example.com" }),
    ).toHaveAttribute("href", "mailto:hello@example.com");
    expect(
      within(contact).getByRole("link", { name: "+00 000000000" }),
    ).toHaveAttribute("href", "tel:+00 000000000");
  });

  it("소셜 링크 3개는 새 탭 안내가 붙은 이름을 가진다", () => {
    renderAbout();
    const list = screen.getByRole("list", { name: "소셜 미디어" });
    const links = within(list).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("aria-label"))).toEqual([
      "Instagram (새 탭에서 열림)",
      "Facebook (새 탭에서 열림)",
      "X (새 탭에서 열림)",
    ]);
    links.forEach((a) => expect(a).toHaveAttribute("target", "_blank"));
  });

  it("함께 작업하기는 문의 링크, 소개서 내려받기는 준비 중이라 비활성 버튼이다", () => {
    renderAbout();
    expect(screen.getByRole("link", { name: "함께 작업하기" })).toHaveAttribute(
      "href",
      "/contact",
    );
    expect(
      screen.getByRole("button", { name: /^소개서 내려받기\s*\(준비 중\)$/ }),
    ).toBeDisabled();
  });

  it("사진 칸에 시각 비교 마스크를 붙인다", () => {
    renderAbout();
    expect(
      screen
        .getByRole("img", { name: "스튜디오 사진" })
        .closest("[data-visual-mask]"),
    ).not.toBeNull();
  });
});
