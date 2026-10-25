import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import ko from "../../../messages/ko.json";
import AdminError from "./error";

// 관리자 화면 오류 (저장소/인증 서비스 장애 등): 한국어 안내, 다시 시도, 작업 목록으로
describe("AdminError", () => {
  it("안내와 다시 시도, 작업 목록 링크", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();
    render(
      <NextIntlClientProvider locale="ko" messages={ko}>
        <AdminError error={new Error("db down")} retry={retry} />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "화면을 불러오지 못했습니다",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(/이미 저장한 내용은 그대로 있습니다/),
    ).toBeVisible();
    expect(screen.queryByText(/db down/)).toBeNull();
    expect(screen.getByRole("link", { name: "작업 목록으로" })).toHaveAttribute(
      "href",
      "/admin",
    );
    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
