import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import ko from "../../../messages/ko.json";
import { WorkDetail } from "./WorkDetail";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: { href: string }) => <a href={href} {...props} />,
}));

const images = [
  { src: "/images/1.jpg", alt: "" },
  { src: "/images/2.jpg", alt: "창가에 선 신부" },
  { src: "/images/3.jpg", alt: "" },
];

const renderDetail = (locale: "ko" | "en" = "ko") =>
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "ko" ? ko : en}
      timeZone="Asia/Seoul"
    >
      <WorkDetail
        title={locale === "ko" ? "어느 결혼식 이야기" : "A Wedding Tale"}
        category="events"
        date="2021-09"
        cover={images[1]}
        images={images}
      />
    </NextIntlClientProvider>,
  );

describe("WorkDetail", () => {
  it("작업 제목이 h1 이고 article 이름이 된다. 라벨은 카테고리, 옆에 촬영 연월", () => {
    renderDetail();
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("어느 결혼식 이야기");
    expect(screen.getByRole("article", { name: "어느 결혼식 이야기" })).toBe(
      h1.closest("article"),
    );
    expect(screen.getByText("이벤트")).toBeInTheDocument();
    expect(screen.getByText("2021년 9월")).toHaveAttribute(
      "dateTime",
      "2021-09",
    );
  });

  it("포트폴리오로 돌아가는 링크가 있다", () => {
    renderDetail();
    expect(screen.getByRole("link", { name: "포트폴리오로" })).toHaveAttribute(
      "href",
      "/portfolio",
    );
  });

  it("대표 사진 아래 '사진 n장' 갤러리에 썸네일 버튼이 사진 수만큼, 설명이 있으면 이름에 붙는다", () => {
    renderDetail();
    const gallery = screen.getByRole("region", { name: "사진 3장" });
    expect(
      within(gallery)
        .getAllByRole("button", { name: /크게 보기/ })
        .map((b) => b.getAttribute("aria-label")),
    ).toEqual([
      "사진 1 크게 보기",
      "사진 2 크게 보기: 창가에 선 신부",
      "사진 3 크게 보기",
    ]);
    // Lightbox 는 닫힌 채로 붙어 있다
    expect(document.querySelector("dialog")).toHaveAttribute(
      "aria-label",
      "어느 결혼식 이야기 사진",
    );
  });

  it("영어", () => {
    renderDetail("en");
    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByText("September 2021")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "3 photos" }),
    ).toBeInTheDocument();
  });
});
