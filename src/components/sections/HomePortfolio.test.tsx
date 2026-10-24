import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import ko from "../../../messages/ko.json";
import { HomePortfolio, type PortfolioPreviewItem } from "./HomePortfolio";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: { href: string }) => <a href={href} {...props} />,
}));

const works: PortfolioPreviewItem[] = [
  { slug: "faces-of-resilience", title: "단단한 얼굴들", date: "2022-03" },
  { slug: "a-wedding-tale", title: "어느 결혼식 이야기", date: "2020-01" },
  { slug: "product-elegance", title: "제품의 품격", date: "2020-01" },
].map((w) => ({
  ...w,
  image: { src: "/images/works/faces-of-resilience-1.jpg", alt: "" },
}));

const renderPortfolio = (locale: "ko" | "en" = "ko") =>
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "ko" ? ko : en}
      timeZone="Asia/Seoul"
    >
      <HomePortfolio items={works} />
    </NextIntlClientProvider>,
  );

describe("HomePortfolio", () => {
  it("제목으로 이름 붙은 carousel 이고, 카드 3장이 'n / 3' 슬라이드다", () => {
    renderPortfolio();
    const carousel = screen.getByRole("region", { name: "작업을 둘러보세요" });
    expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
    const slides = within(carousel).getAllByRole("group");
    expect(slides.map((s) => s.getAttribute("aria-label"))).toEqual([
      "1 / 3",
      "2 / 3",
      "3 / 3",
    ]);
    expect(within(carousel).getAllByRole("article")).toHaveLength(3);
  });

  it("카드 링크는 /work/[slug], 모두 보기는 Portfolio 페이지로 간다", () => {
    renderPortfolio();
    expect(
      screen
        .getAllByRole("link", { name: /^프로젝트 보기/ })
        .map((a) => a.getAttribute("href")),
    ).toEqual([
      "/work/faces-of-resilience",
      "/work/a-wedding-tale",
      "/work/product-elegance",
    ]);
    expect(
      screen.getByRole("link", { name: "모든 작업 보기" }),
    ).toHaveAttribute("href", "/portfolio");
  });

  it("날짜는 언어별 연월 형식으로 보이고 dateTime 은 그대로다", () => {
    const { unmount } = renderPortfolio("ko");
    expect(screen.getByText("2022년 3월")).toHaveAttribute(
      "dateTime",
      "2022-03",
    );
    unmount();
    renderPortfolio("en");
    expect(screen.getByText("March 2022")).toBeInTheDocument();
    expect(screen.getAllByText("January 2020")).toHaveLength(2);
  });
});
