import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { PriceCard } from "./PriceCard";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: { href: string }) => <a href={href} {...props} />,
}));

const features = [
  "한 사람의 개성과 분위기를 담기에 알맞습니다.",
  "2시간 촬영과 보정본 20장을 포함합니다.",
];

const renderCard = (
  locale: "ko" | "en",
  price?: { amount: number; currency: string },
) =>
  render(
    <NextIntlClientProvider locale={locale} messages={{}}>
      <PriceCard
        name="개인 촬영"
        price={price}
        customPriceLabel="맞춤 견적"
        features={features}
        actionLabel="상담 예약"
      />
    </NextIntlClientProvider>,
  );

describe("PriceCard", () => {
  it("패키지 이름(h3)이 카드 이름이 되고 포함 항목은 <ul> 이다", () => {
    renderCard("ko", { amount: 250_000, currency: "KRW" });
    const card = screen.getByRole("article", { name: "개인 촬영" });
    const list = within(card).getByRole("list");
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(features);
  });

  it("가격은 숫자를 data 에 두고 언어별 통화 표기로 보여준다", () => {
    const { unmount } = renderCard("ko", { amount: 250_000, currency: "KRW" });
    const ko = screen.getByText("₩25만");
    expect(ko.tagName).toBe("DATA");
    expect(ko).toHaveAttribute("value", "250000");
    unmount();

    renderCard("en", { amount: 250_000, currency: "KRW" });
    expect(screen.getByText("₩250K")).toHaveAttribute("value", "250000");
  });

  it("가격이 없으면 맞춤 견적 문구", () => {
    renderCard("ko");
    expect(screen.getByText("맞춤 견적")).toBeVisible();
    expect(document.querySelector("data")).toBeNull();
  });

  it("문의 버튼은 /contact 링크이고 이름에 패키지가 붙는다", () => {
    renderCard("ko", { amount: 250_000, currency: "KRW" });
    expect(
      screen.getByRole("link", { name: "상담 예약: 개인 촬영" }),
    ).toHaveAttribute("href", "/contact");
  });
});
