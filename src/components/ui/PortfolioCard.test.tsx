import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PortfolioCard } from "./PortfolioCard";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: { href: string }) => <a href={href} {...props} />,
}));

const renderCard = () =>
  render(
    <PortfolioCard
      href="/work/faces-of-resilience"
      title="단단한 얼굴들"
      date="2022-03"
      dateLabel="2022년 3월"
      image={{ src: "/images/placeholder.svg", alt: "인물 사진" }}
      viewLabel="프로젝트 보기"
    />,
  );

describe("PortfolioCard", () => {
  it("article 안에 사진, 제목(h3), 날짜(time)를 둔다", () => {
    renderCard();
    const card = screen.getByRole("article");
    expect(within(card).getByRole("img", { name: "인물 사진" })).toBeVisible();
    expect(
      within(card).getByRole("heading", { level: 3, name: "단단한 얼굴들" }),
    ).toBeInTheDocument();
    const time = within(card).getByText("2022년 3월");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("dateTime", "2022-03");
  });

  it("링크는 작업 상세로 가고, 이름에 제목이 붙어 카드끼리 구분된다", () => {
    renderCard();
    expect(
      screen.getByRole("link", { name: "프로젝트 보기: 단단한 얼굴들" }),
    ).toHaveAttribute("href", "/work/faces-of-resilience");
  });

  it("사진 자리는 시각 비교에서 가린다", () => {
    renderCard();
    expect(
      screen.getByRole("img").closest("[data-visual-mask]"),
    ).not.toBeNull();
  });
});
