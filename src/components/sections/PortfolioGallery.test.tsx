import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import ko from "../../../messages/ko.json";
import type { PortfolioPreviewItem } from "./HomePortfolio";
import { PortfolioGallery } from "./PortfolioGallery";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: { href: string }) => <a href={href} {...props} />,
}));

const item = (slug: string, title: string): PortfolioPreviewItem => ({
  slug,
  title,
  date: "2022-03",
  image: { src: "/images/placeholder.svg", alt: "" },
});

const renderGallery = (
  galleries: Parameters<typeof PortfolioGallery>[0]["galleries"],
) =>
  render(
    <NextIntlClientProvider locale="ko" messages={ko} timeZone="Asia/Seoul">
      <PortfolioGallery galleries={galleries} />
    </NextIntlClientProvider>,
  );

describe("PortfolioGallery", () => {
  it("카테고리마다 제목(h2)으로 이름 붙은 carousel 이 순서대로 있다", () => {
    renderGallery([
      {
        category: "portrait",
        items: [item("faces", "단단한 얼굴들"), item("mono", "흑백")],
      },
      { category: "events", items: [item("wedding", "결혼식")] },
    ]);
    const carousels = screen.getAllByRole("region");
    expect(
      carousels.map((c) => c.getAttribute("aria-roledescription")),
    ).toEqual(["carousel", "carousel"]);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual(["인물 사진", "이벤트 사진"]);
    const portraits = screen.getByRole("region", { name: "인물 사진" });
    expect(
      within(portraits)
        .getAllByRole("link", { name: /^프로젝트 보기/ })
        .map((a) => a.getAttribute("href")),
    ).toEqual(["/work/faces", "/work/mono"]);
    expect(within(portraits).getAllByText("2022년 3월")).toHaveLength(2);
  });

  it("화살표 이름에 카테고리가 붙어 여러 갤러리끼리 구분된다", () => {
    renderGallery([
      { category: "portrait", items: [item("faces", "단단한 얼굴들")] },
      { category: "commercial", items: [item("brand", "브랜드")] },
    ]);
    expect(
      screen.getByRole("button", { name: "다음 인물 작업" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "이전 광고 작업" }),
    ).toBeInTheDocument();
  });

  it("공개 작업이 없는 카테고리는 슬라이더 대신 안내 문구", () => {
    renderGallery([{ category: "events", items: [] }]);
    const section = screen.getByRole("region", { name: "이벤트 사진" });
    expect(section).not.toHaveAttribute("aria-roledescription");
    expect(
      within(section).getByText("아직 공개한 작업이 없습니다."),
    ).toBeInTheDocument();
    expect(within(section).queryByRole("button")).toBeNull();
  });

  it("갤러리 묶음 전체는 #works (시각 비교 섹션 선택자)", () => {
    const { container } = renderGallery([]);
    expect(container.querySelector("#works")).not.toBeNull();
  });
});
