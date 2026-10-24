import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/ko.json";
import { ServicesHero } from "./ServicesHero";

const renderHero = () =>
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <ServicesHero
        image={{ src: "/images/works/faces-of-resilience-1.jpg", alt: "" }}
      />
    </NextIntlClientProvider>,
  );

describe("ServicesHero", () => {
  it("제목이 페이지 h1 이고 섹션 이름이 된다", () => {
    renderHero();
    const h1 = screen.getByRole("heading", {
      level: 1,
      name: "다양한 촬영 서비스",
    });
    expect(screen.getByRole("region", { name: "다양한 촬영 서비스" })).toBe(
      h1.closest("section"),
    );
    expect(screen.getByText("서비스")).toBeInTheDocument();
  });

  it("꾸밈 조각과 사진 마스크는 보조기기에서 숨긴다", () => {
    const { container } = renderHero();
    const masks = container.querySelectorAll(
      "[data-visual-mask]:not([class*='photo-corner'])",
    );
    // mobile 사진 하나 + lg 사진이 보이는 사각형 셋 (위 왼쪽, 가운데, 아래 가운데)
    expect(masks).toHaveLength(4);
    for (const mask of masks) {
      expect(mask).toHaveAttribute("aria-hidden");
    }
  });
});
