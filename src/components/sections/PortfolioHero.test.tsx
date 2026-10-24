import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/ko.json";
import { PortfolioHero } from "./PortfolioHero";

const renderHero = () =>
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <PortfolioHero
        image={{ src: "/images/works/faces-of-resilience-1.jpg", alt: "" }}
      />
    </NextIntlClientProvider>,
  );

describe("PortfolioHero", () => {
  it("제목이 페이지 h1 이고 섹션 이름이 된다", () => {
    renderHero();
    const h1 = screen.getByRole("heading", { level: 1, name: "픽셀로 쓴 시" });
    expect(screen.getByRole("region", { name: "픽셀로 쓴 시" })).toBe(
      h1.closest("section"),
    );
    expect(screen.getByText("포트폴리오")).toBeInTheDocument();
  });

  it("꾸밈 조각과 사진 마스크는 보조기기에서 숨긴다", () => {
    const { container } = renderHero();
    const masks = container.querySelectorAll(
      "[data-visual-mask]:not([class*='photo-corner'])",
    );
    // mobile 사진 하나 + lg 사진이 보이는 사각형 셋
    expect(masks).toHaveLength(4);
    for (const mask of masks) {
      expect(mask).toHaveAttribute("aria-hidden");
    }
  });
});
