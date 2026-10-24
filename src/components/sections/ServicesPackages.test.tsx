import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/ko.json";
import { ServicesPackages, type ServiceOffering } from "./ServicesPackages";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: { href: string }) => <a href={href} {...props} />,
}));

const page = messages.ServicesPage;
const photo = { src: "/images/works/faces-of-resilience-1.jpg", alt: "" };
const services: ServiceOffering[] = [
  {
    id: "portrait",
    title: page.services.portrait,
    body: messages.Services.items.portrait.body,
    images: [photo, photo],
    packages: [
      {
        id: "individual",
        name: page.packages.individual.name,
        price: { amount: 250_000, currency: "KRW" },
        features: Object.values(page.packages.individual.features),
      },
    ],
  },
  {
    id: "events",
    title: page.services.events,
    body: messages.Services.items.events.body,
    images: [photo],
    packages: [
      {
        id: "wedding",
        name: page.packages.wedding.name,
        price: { amount: 1_500_000, currency: "KRW" },
        features: Object.values(page.packages.wedding.features),
      },
      {
        id: "corporate",
        name: page.packages.corporate.name,
        features: Object.values(page.packages.corporate.features),
      },
    ],
  },
];

const renderPackages = () =>
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <ServicesPackages services={services} />
    </NextIntlClientProvider>,
  );

describe("ServicesPackages", () => {
  it("서비스마다 id 앵커가 있는 섹션이고 제목은 h2", () => {
    renderPackages();
    const portrait = screen.getByRole("region", { name: "인물 촬영" });
    expect(portrait).toHaveAttribute("id", "portrait");
    expect(screen.getByRole("region", { name: "이벤트 촬영" })).toHaveAttribute(
      "id",
      "events",
    );
    expect(
      within(portrait).getByRole("heading", { level: 2, name: "인물 촬영" }),
    ).toBeInTheDocument();
  });

  it("작업 보기 링크는 Portfolio 의 같은 분야 필터로 간다", () => {
    renderPackages();
    expect(
      screen.getByRole("link", { name: "작업 보기: 인물 촬영" }),
    ).toHaveAttribute("href", "/portfolio?category=portrait");
  });

  it("패키지는 PriceCard 로, 가격이 없으면 맞춤 견적", () => {
    renderPackages();
    const events = screen.getByRole("region", { name: "이벤트 촬영" });
    const cards = within(events).getAllByRole("article");
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText("₩150만")).toBeInTheDocument();
    expect(within(cards[1]).getByText("맞춤 견적")).toBeInTheDocument();
    expect(
      within(cards[1]).getByRole("link", { name: "상담 예약: 기업 행사" }),
    ).toHaveAttribute("href", "/contact");
  });

  it("사진 슬라이더 이름과 화살표에 서비스 이름이 붙는다", () => {
    renderPackages();
    expect(
      screen.getByRole("group", { name: "인물 촬영 사진" }),
    ).toHaveAttribute("aria-roledescription", "carousel");
    expect(
      screen.getByRole("button", { name: "다음 인물 촬영 사진" }),
    ).toBeInTheDocument();
  });
});
