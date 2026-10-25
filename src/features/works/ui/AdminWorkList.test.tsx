import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../../messages/ko.json";
import { AdminWorkList, type AdminWorkRow } from "./AdminWorkList";

const row = (patch: Partial<AdminWorkRow>): AdminWorkRow => ({
  id: "work-01",
  slug: "faces-of-resilience",
  titleKo: "단단한 얼굴들",
  titleEn: "Faces of Resilience",
  date: "2022-03",
  published: true,
  cover: { src: "/images/works/faces-of-resilience-1.jpg", alt: "여성" },
  photoCount: 3,
  ...patch,
});

const renderList = (props: Parameters<typeof AdminWorkList>[0]) =>
  render(
    <NextIntlClientProvider locale="ko" messages={messages} timeZone="UTC">
      <AdminWorkList {...props} />
    </NextIntlClientProvider>,
  );

describe("AdminWorkList", () => {
  it("작업마다 대표 사진, 제목, 공개 여부(글자), 촬영 연월, 사진 수, 고치기 링크", () => {
    renderList({
      works: [
        row({}),
        row({
          id: "w-2",
          slug: "secret",
          titleKo: "비공개 작업",
          published: false,
          date: "2024-05",
          photoCount: 1,
        }),
      ],
    });
    const items = within(
      screen.getByRole("list", { name: "작업 목록" }),
    ).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    const [first, second] = items as [HTMLElement, HTMLElement];
    expect(within(first).getByRole("heading", { level: 2 })).toHaveTextContent(
      "단단한 얼굴들",
    );
    expect(
      within(first).getByRole("img", { name: "여성" }),
    ).toBeInTheDocument();
    expect(first).toHaveTextContent("공개2022년 3월·사진 3장");
    expect(
      within(first).getByRole("link", { name: "단단한 얼굴들 고치기" }),
    ).toHaveAttribute("href", "/admin/works/work-01");
    expect(
      within(first).getByRole("link", {
        name: "단단한 얼굴들 공개 화면 (새 탭)",
      }),
    ).toHaveAttribute("href", "/work/faces-of-resilience");
    // 비공개는 공개 화면 링크가 없다
    expect(second).toHaveTextContent("비공개");
    expect(within(second).getAllByRole("link")).toHaveLength(1);
  });

  it("새 작업 만들기 링크, 빈 목록 안내, 지운 뒤 알림", () => {
    renderList({ works: [], notice: "deleted" });
    expect(
      screen.getByRole("link", { name: "새 작업 만들기" }),
    ).toHaveAttribute("href", "/admin/works/new");
    expect(screen.getByText(/아직 작업이 없습니다/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("작업을 지웠습니다.");
  });
});
