import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeAll, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/ko.json";
import type { AdminInquiryDetailView } from "../admin-view";
import { AdminInquiryDetail } from "./AdminInquiryDetail";

// jsdom 은 <dialog> 의 showModal/close 가 없다. open 속성만 바꾼다
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});

const id = "00000000-0000-4000-8000-00000000c001";
const inquiry = (
  patch: Partial<AdminInquiryDetailView> = {},
): AdminInquiryDetailView => ({
  id,
  name: "하늘 김",
  email: "sky@example.com",
  phone: "+82 10-1234-5678",
  message: "가족사진 촬영 문의드립니다.\n\n- 4명\n- 11월 주말",
  receivedAt: new Date("2026-10-20T09:05:00Z"),
  status: "New",
  changedAt: null,
  actions: ["markRead"],
  ...patch,
});

const renderDetail = (
  props: Partial<Parameters<typeof AdminInquiryDetail>[0]> = {},
) => {
  const changeStatus = vi.fn(async () => {});
  const remove = vi.fn(async () => {});
  render(
    <NextIntlClientProvider locale="ko" messages={messages} timeZone="UTC">
      <AdminInquiryDetail
        inquiry={inquiry()}
        actions={{ changeStatus, remove }}
        {...props}
      />
    </NextIntlClientProvider>,
  );
  return { changeStatus, remove };
};

describe("AdminInquiryDetail", () => {
  it("제목, 전체 메시지(줄바꿈 그대로), 연락처, 받은 시각(KST)", () => {
    renderDetail();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "하늘 김 님의 문의",
    );
    const message = within(
      screen.getByRole("region", { name: "메시지" }),
    ).getByText(/가족사진/);
    expect(message.textContent).toBe(
      "가족사진 촬영 문의드립니다.\n\n- 4명\n- 11월 주말",
    );
    expect(message).toHaveClass("whitespace-pre-wrap");
    const contact = within(screen.getByRole("region", { name: "연락처" }));
    expect(contact.getByText("sky@example.com")).toBeInTheDocument();
    expect(contact.getByText("+82 10-1234-5678")).toBeInTheDocument();
    const handling = within(screen.getByRole("region", { name: "처리" }));
    expect(
      handling.getByText(/2026\. 10\. 20\. 오후 6:05/),
    ).toBeInTheDocument();
    // New 는 상태 바뀐 시각이 없다
    expect(handling.queryByText("확인한 시각")).toBeNull();
  });

  it("연락처가 없으면 '남기지 않음'", () => {
    renderDetail({ inquiry: inquiry({ phone: null }) });
    expect(screen.getByText("남기지 않음")).toBeInTheDocument();
  });

  it("답장: 받는 사람과 제목을 채운 mailto", () => {
    renderDetail();
    const reply = screen.getByRole("link", {
      name: "하늘 김 님에게 메일로 답장 (메일 앱이 열립니다)",
    });
    expect(reply).toHaveAttribute(
      "href",
      `mailto:sky@example.com?subject=${encodeURIComponent("[Machum Studio] 문의 주셔서 감사합니다")}`,
    );
  });

  it.each([
    ["New", ["markRead"], "확인으로 바꾸기", null],
    ["Read", ["markDone"], "완료로 바꾸기", "확인한 시각"],
    ["Done", ["reopen"], "다시 열기", "완료한 시각"],
  ] as const)(
    "%s: 허용된 동작 버튼만, 상태 바뀐 시각",
    (status, actions, label, changedLabel) => {
      renderDetail({
        inquiry: inquiry({
          status,
          actions: [...actions],
          changedAt: status === "New" ? null : new Date("2026-10-21T00:30:00Z"),
        }),
      });
      const handling = within(screen.getByRole("region", { name: "처리" }));
      const buttons = handling.getAllByRole("button");
      expect(buttons.map((b) => b.textContent)).toEqual([label]);
      expect(buttons[0]).toHaveAccessibleDescription(/누릅니다/);
      if (changedLabel) {
        expect(handling.getByText(changedLabel)).toBeInTheDocument();
        expect(
          handling.getByText(/2026\. 10\. 21\. 오전 9:30/),
        ).toBeInTheDocument();
      }
    },
  );

  it("상태 버튼은 id 와 동작을 담아 서버 액션 폼으로 보낸다", async () => {
    const { changeStatus } = renderDetail();
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "확인으로 바꾸기" })),
    );
    expect(changeStatus).toHaveBeenCalledTimes(1);
    const data = (changeStatus.mock.calls[0] as unknown as [FormData])[0];
    expect(Object.fromEntries(data)).toEqual({ id, action: "markRead" });
  });

  it("열기만 해서는 상태가 바뀌지 않는다고 알린다 (자동 확인 없음)", () => {
    const { changeStatus } = renderDetail();
    expect(
      screen.getByText("이 화면을 열기만 해서는 상태가 바뀌지 않습니다."),
    ).toBeInTheDocument();
    expect(changeStatus).not.toHaveBeenCalled();
  });

  it.each([
    ["markRead", "‘확인’으로 바꿨습니다."],
    ["conflict", "다른 탭이나 기기에서 이 문의의 상태를 먼저 바꿨습니다"],
    ["unavailable", "지금은 처리할 수 없습니다"],
  ] as const)("알림 %s (role=status)", (notice, text) => {
    renderDetail({ notice });
    expect(screen.getByRole("status")).toHaveTextContent(text);
  });

  it("지우기: 확인 창(처음 포커스 취소) → 취소하면 닫힘, 지우기를 누르면 id 를 보낸다", async () => {
    const { remove } = renderDetail();
    fireEvent.click(screen.getByRole("button", { name: "문의 지우기" }));
    const dialog = screen.getByRole("dialog", { name: "이 문의를 지울까요?" });
    expect(dialog).toHaveAccessibleDescription(
      "하늘 김 님의 문의와 연락처를 모두 지웁니다. 지운 뒤에는 되돌릴 수 없습니다.",
    );
    const buttons = within(dialog).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual(["취소", "지우기"]);
    fireEvent.click(buttons[0]!);
    expect(dialog).not.toHaveAttribute("open");
    expect(remove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "문의 지우기" }));
    await act(async () =>
      fireEvent.click(
        within(
          screen.getByRole("dialog", { name: "이 문의를 지울까요?" }),
        ).getByRole("button", { name: "지우기" }),
      ),
    );
    expect(remove).toHaveBeenCalledTimes(1);
    const data = (remove.mock.calls[0] as unknown as [FormData])[0];
    expect(Object.fromEntries(data)).toEqual({ id });
  });

  it("지우기가 실패해 알림과 함께 돌아오면 확인 창이 닫혀 알림이 보인다", () => {
    const actions = { changeStatus: vi.fn(), remove: vi.fn() };
    const view = (notice?: "unavailable") => (
      <NextIntlClientProvider locale="ko" messages={messages} timeZone="UTC">
        <AdminInquiryDetail
          inquiry={inquiry()}
          notice={notice}
          actions={actions}
        />
      </NextIntlClientProvider>
    );
    const { rerender } = render(view());
    fireEvent.click(screen.getByRole("button", { name: "문의 지우기" }));
    expect(
      screen.getByRole("dialog", { name: "이 문의를 지울까요?" }),
    ).toHaveAttribute("open");
    rerender(view("unavailable"));
    expect(
      screen.queryByRole("dialog", { name: "이 문의를 지울까요?" }),
    ).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      "지금은 처리할 수 없습니다",
    );
  });
});
