import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/ko.json";
import { SiteTestimonials, type Testimonial } from "./SiteTestimonials";

const items: Testimonial[] = Object.entries(messages.Testimonials.items).map(
  ([id, item]) => ({
    id,
    ...item,
    rating: 5,
    socials: [
      { network: "instagram", href: "https://www.instagram.com/" },
      { network: "x", href: "https://x.com/" },
    ],
  }),
);

const renderSection = () =>
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <SiteTestimonials total={1323} items={items} />
    </NextIntlClientProvider>,
  );

describe("SiteTestimonials", () => {
  it("제목으로 이름 붙은 carousel 이고 푸터 링크 목적지(#testimonials)다", () => {
    renderSection();
    const carousel = screen.getByRole("region", {
      name: "고객이 전하는 이야기",
    });
    expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
    expect(carousel).toHaveAttribute("id", "testimonials");
  });

  it("전체 리뷰 수를 로캘 형식으로 보여준다", () => {
    renderSection();
    expect(screen.getByText("전체 리뷰").parentElement).toHaveTextContent(
      "전체 리뷰1,323",
    );
  });

  it("후기마다 'n / 전체' 슬라이드 안에 카드가 있다", () => {
    renderSection();
    const slides = screen.getAllByRole("group");
    expect(slides.map((s) => s.getAttribute("aria-label"))).toEqual([
      "1 / 6",
      "2 / 6",
      "3 / 6",
      "4 / 6",
      "5 / 6",
      "6 / 6",
    ]);
    const first = within(slides[0]);
    expect(first.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Emily Johnson",
    );
    expect(
      first.getByRole("img", { name: "5점 만점에 5점" }),
    ).toBeInTheDocument();
    expect(
      first.getAllByRole("link").map((a) => a.getAttribute("aria-label")),
    ).toEqual([
      "Emily Johnson의 Instagram (새 탭에서 열림)",
      "Emily Johnson의 X (새 탭에서 열림)",
    ]);
  });

  it("이전/다음 화살표가 있다", () => {
    renderSection();
    expect(
      screen.getByRole("button", { name: "이전 후기" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "다음 후기" }),
    ).toBeInTheDocument();
  });
});
