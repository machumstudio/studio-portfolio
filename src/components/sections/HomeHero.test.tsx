import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/ko.json";
import { HomeHero, heroPhotoCount } from "./HomeHero";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: { href: string }) => <a href={href} {...props} />,
}));

const photos = Array.from({ length: heroPhotoCount }, (_, i) => ({
  src: "/images/placeholder.svg",
  alt: `사진 ${i + 1}`,
}));

const renderHero = () =>
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <HomeHero photos={photos} />
    </NextIntlClientProvider>,
  );

describe("HomeHero", () => {
  it("이름이 페이지 h1 이고 섹션 이름이 된다", () => {
    renderHero();
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Machum Studio");
    expect(screen.getByRole("region", { name: "Machum Studio" })).toBe(
      h1.closest("section"),
    );
  });

  it("문의 페이지로 가는 CTA 버튼과 촬영 분야 마키가 있다", () => {
    renderHero();
    const section = screen.getByRole("region", { name: "Machum Studio" });
    expect(
      within(section).getByRole("link", { name: "문의하기" }),
    ).toHaveAttribute("href", "/contact");
    expect(
      within(section).getByRole("list", { name: "촬영 분야" }),
    ).toBeInTheDocument();
    // 히어로의 CTA 에는 푸터용 라벨이 없다
    expect(
      within(section).queryByText(messages.Layout.cta.eyebrow),
    ).not.toBeInTheDocument();
  });

  it("사진 칸마다 시각 비교 마스크를 붙이고 받은 사진을 순서대로 넣는다", () => {
    const { container } = renderHero();
    const tiles = container.querySelectorAll("[data-visual-mask]");
    expect(tiles).toHaveLength(heroPhotoCount);
    expect(
      screen.getAllByRole("img").map((img) => img.getAttribute("alt")),
    ).toEqual(photos.map((photo) => photo.alt));
  });
});
