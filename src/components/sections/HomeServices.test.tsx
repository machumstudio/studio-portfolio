import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/ko.json";
import { HomeServices, type HomeService } from "./HomeServices";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: { href: string }) => <a href={href} {...props} />,
}));

const { items } = messages.Services;
const services: HomeService[] = (
  ["events", "portrait", "commercial"] as const
).map((id) => ({
  id,
  name: items[id].name,
  body: items[id].body,
  highlights: Object.values(items[id].highlights),
  image: {
    src: "/images/works/faces-of-resilience-1.jpg",
    alt: `${items[id].name} 사진`,
  },
}));

const renderServices = () =>
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <HomeServices items={services} />
    </NextIntlClientProvider>,
  );

describe("HomeServices", () => {
  it("제목으로 이름 붙은 carousel 이고, 서비스마다 'n / 3' 슬라이드다", () => {
    renderServices();
    const carousel = screen.getByRole("region", { name: "촬영 서비스" });
    expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
    expect(
      within(carousel)
        .getAllByRole("group")
        .map((s) => s.getAttribute("aria-label")),
    ).toEqual(["1 / 3", "2 / 3", "3 / 3"]);
  });

  it("슬라이드마다 서비스 이름(h3), 설명, 하이라이트 4줄, 사진이 있다", () => {
    renderServices();
    const slides = screen.getAllByRole("group");
    slides.forEach((slide, i) => {
      const service = within(slide).getByRole("article", {
        name: services[i].name,
      });
      expect(service).toHaveTextContent(services[i].body);
      expect(
        within(service).getByRole("heading", { level: 4, name: "서비스 특징" }),
      ).toBeInTheDocument();
      expect(
        within(service)
          .getAllByRole("listitem")
          .map((li) => li.textContent),
      ).toEqual(services[i].highlights);
      expect(
        within(service)
          .getByRole("img", { name: `${services[i].name} 사진` })
          .closest("[data-visual-mask]"),
      ).not.toBeNull();
    });
  });

  it("모두 보기는 Services 페이지로, 보라 화살표는 그 서비스 위치로 간다", () => {
    renderServices();
    expect(
      screen.getByRole("link", { name: "모든 서비스 보기" }),
    ).toHaveAttribute("href", "/services");
    expect(
      screen.getByRole("link", { name: "이벤트 촬영 자세히 보기" }),
    ).toHaveAttribute("href", "/services#events");
    expect(
      screen.getByRole("link", { name: "광고 촬영 자세히 보기" }),
    ).toHaveAttribute("href", "/services#commercial");
  });

  it("화살표 다음 Tab 은 모두 보기 버튼이다", () => {
    renderServices();
    const next = screen.getByRole("button", { name: "다음 서비스" });
    const all = screen.getByRole("link", { name: "모든 서비스 보기" });
    expect(
      next.compareDocumentPosition(all) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
