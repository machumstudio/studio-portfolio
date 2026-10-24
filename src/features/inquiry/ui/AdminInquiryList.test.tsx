import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../../messages/ko.json";
import type { AdminInquiryListView, AdminInquiryRow } from "../admin-view";
import { AdminInquiryList } from "./AdminInquiryList";

const row = (patch: Partial<AdminInquiryRow> = {}): AdminInquiryRow => ({
  id: "00000000-0000-4000-8000-00000000c001",
  name: "하늘 김",
  email: "sky@example.com",
  // KST 2026-10-20 18:05
  receivedAt: new Date("2026-10-20T09:05:00Z"),
  status: "New",
  preview: "가족사진 촬영 문의드립니다.",
  ...patch,
});

const view = (
  patch: Partial<AdminInquiryListView> = {},
): AdminInquiryListView => ({
  items: [row()],
  counts: { New: 3, Read: 2, Done: 7 },
  total: 12,
  status: null,
  page: 1,
  pageCount: 1,
  ...patch,
});

// 테스트 환경의 시간대(UTC)와 달라도 KST 로 보이는지 본다
const renderList = (props: Parameters<typeof AdminInquiryList>[0]) =>
  render(
    <NextIntlClientProvider locale="ko" messages={messages} timeZone="UTC">
      <AdminInquiryList {...props} />
    </NextIntlClientProvider>,
  );

describe("AdminInquiryList", () => {
  it("문의마다 상태(글자), 이름 링크(상세), 받은 시각(KST), 이메일, 메시지 앞부분", () => {
    renderList({
      list: view({
        items: [
          row(),
          row({
            id: "id-2",
            name: "Alex Morgan",
            email: "alex@example.com",
            status: "Done",
            preview: "Wedding",
          }),
        ],
      }),
    });
    const items = within(
      screen.getByRole("list", { name: "문의 목록" }),
    ).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    const first = within(items[0]!);
    expect(first.getByText("새 문의")).toBeInTheDocument();
    expect(
      first.getByRole("link", { name: "하늘 김 님의 문의 열기" }),
    ).toHaveAttribute(
      "href",
      "/admin/inquiries/00000000-0000-4000-8000-00000000c001",
    );
    expect(first.getByRole("heading", { level: 2 })).toHaveTextContent(
      "하늘 김",
    );
    const time = items[0]!.querySelector("time")!;
    expect(time).toHaveAttribute("dateTime", "2026-10-20T09:05:00.000Z");
    expect(time.textContent).toMatch(/2026\. 10\. 20\. 오후 6:05/);
    expect(first.getByText("sky@example.com")).toBeInTheDocument();
    expect(first.getByText("가족사진 촬영 문의드립니다.")).toBeInTheDocument();
    expect(within(items[1]!).getByText("완료")).toBeInTheDocument();
  });

  it("상태 필터: 전체와 상태마다 개수, 지금 필터는 aria-current", () => {
    renderList({ list: view({ status: "Read" }) });
    const nav = screen.getByRole("navigation", { name: "상태로 거르기" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "전체 12건",
      "새 문의 3건",
      "확인 2건",
      "완료 7건",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/admin/inquiries",
      "/admin/inquiries?status=new",
      "/admin/inquiries?status=read",
      "/admin/inquiries?status=done",
    ]);
    expect(
      within(nav).getByRole("link", { current: "page" }),
    ).toHaveTextContent("확인 2건");
  });

  it("페이지: 필터를 유지한 이전/다음 링크, 첫 페이지에는 이전 링크가 없다", () => {
    const { rerender } = renderList({
      list: view({ status: "New", page: 1, pageCount: 3 }),
    });
    const nav = () => screen.getByRole("navigation", { name: "페이지" });
    expect(within(nav()).getByText("1 / 3 페이지")).toBeInTheDocument();
    expect(
      within(nav()).queryByRole("link", { name: "이전 페이지" }),
    ).toBeNull();
    expect(
      within(nav()).getByRole("link", { name: "다음 페이지" }),
    ).toHaveAttribute("href", "/admin/inquiries?status=new&page=2");

    rerender(
      <NextIntlClientProvider locale="ko" messages={messages} timeZone="UTC">
        <AdminInquiryList
          list={view({ status: "New", page: 3, pageCount: 3 })}
        />
      </NextIntlClientProvider>,
    );
    expect(
      within(nav()).getByRole("link", { name: "이전 페이지" }),
    ).toHaveAttribute("href", "/admin/inquiries?status=new&page=2");
    expect(
      within(nav()).queryByRole("link", { name: "다음 페이지" }),
    ).toBeNull();
  });

  it("한 페이지뿐이면 페이지 이동이 없다", () => {
    renderList({ list: view() });
    expect(screen.queryByRole("navigation", { name: "페이지" })).toBeNull();
  });

  it("비었을 때: 전체는 안내, 필터는 그 상태가 없다고", () => {
    const { unmount } = renderList({
      list: view({ items: [], counts: { New: 0, Read: 0, Done: 0 }, total: 0 }),
    });
    expect(screen.getByText(/아직 받은 문의가 없습니다/)).toBeInTheDocument();
    unmount();
    renderList({ list: view({ items: [], status: "Done" }) });
    expect(
      screen.getByText("‘완료’ 상태인 문의가 없습니다."),
    ).toBeInTheDocument();
  });

  it("지우고 왔으면 알림 (role=status)", () => {
    renderList({ list: view(), notice: "deleted" });
    expect(screen.getByRole("status")).toHaveTextContent("문의를 지웠습니다.");
  });
});
