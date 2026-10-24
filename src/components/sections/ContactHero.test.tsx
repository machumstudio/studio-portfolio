import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/ko.json";
import { ContactHero } from "./ContactHero";

const renderHero = () =>
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <ContactHero
        image={{ src: "/images/works/faces-of-resilience-1.jpg", alt: "" }}
      />
    </NextIntlClientProvider>,
  );

describe("ContactHero", () => {
  it("제목이 페이지 h1 이고 섹션 이름이 된다", () => {
    renderHero();
    const h1 = screen.getByRole("heading", {
      level: 1,
      name: "함께 이야기해요",
    });
    expect(screen.getByRole("region", { name: "함께 이야기해요" })).toBe(
      h1.closest("section"),
    );
  });

  it("글이 소셜 링크보다 먼저 읽힌다 (화면 순서는 mobile 에서 사진 아래)", () => {
    renderHero();
    const h1 = screen.getByRole("heading", { level: 1 });
    const socials = screen.getByRole("list", { name: "소셜 미디어" });
    expect(
      h1.compareDocumentPosition(socials) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("소셜 링크 셋은 새 탭으로 열린다고 알린다", () => {
    renderHero();
    const links = within(
      screen.getByRole("list", { name: "소셜 미디어" }),
    ).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("aria-label"))).toEqual([
      "Instagram (새 탭에서 열림)",
      "Facebook (새 탭에서 열림)",
      "X (새 탭에서 열림)",
    ]);
    for (const a of links) expect(a).toHaveAttribute("target", "_blank");
  });

  it("꾸밈 조각과 사진 마스크는 보조기기에서 숨긴다", () => {
    const { container } = renderHero();
    const masks = container.querySelectorAll("[data-visual-mask]");
    // mobile 사진 하나 + lg 사진이 보이는 사각형 넷 (위 띠, 소셜 칸 왼쪽, 오른쪽 가운데, 아래 왼쪽)
    expect(masks).toHaveLength(5);
    for (const mask of masks) expect(mask).toHaveAttribute("aria-hidden");
  });
});
