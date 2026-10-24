import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/ko.json";
import type { AdminLoginState } from "../form-state";
import { AdminLoginForm } from "./AdminLoginForm";

type Action = (s: AdminLoginState, f: FormData) => Promise<AdminLoginState>;

const renderForm = (
  action: Action = vi.fn<Action>(async () => ({ status: "idle" })),
  props: { initialState?: AdminLoginState } = {},
) => {
  const { container } = render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <AdminLoginForm action={action} {...props} />
    </NextIntlClientProvider>,
  );
  return { action, container };
};

const invalid = (email = "admin@example.com"): AdminLoginState => ({
  status: "error",
  code: "invalid",
  email,
});

describe("AdminLoginForm", () => {
  it("이메일/비밀번호 칸, 자동완성, 링크 없음", () => {
    const { container } = renderForm();
    const form = screen.getByRole("form", { name: "관리자 로그인 양식" });
    expect(form).toHaveAttribute("novalidate");
    expect(screen.getByLabelText("이메일")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("이메일")).toHaveAttribute(
      "autocomplete",
      "username",
    );
    expect(screen.getByLabelText("비밀번호")).toHaveAttribute(
      "type",
      "password",
    );
    expect(screen.getByLabelText("비밀번호")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    // 가입, 비밀번호 찾기 같은 링크가 없다
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(screen.getByLabelText("이메일")).toHaveFocus();
  });

  it("보내는 칸은 이메일과 비밀번호뿐이다 (돌아갈 곳은 서버가 쿠키로 안다)", async () => {
    const user = userEvent.setup();
    const { action } = renderForm();
    await user.type(screen.getByLabelText("이메일"), "admin@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "pw");
    await user.click(screen.getByRole("button", { name: "로그인" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const data = vi.mocked(action).mock.calls[0][1];
    expect(Object.fromEntries(data)).toEqual({
      email: "admin@example.com",
      password: "pw",
    });
  });

  it("실패: 문구 하나를 두 칸에 잇고, 이메일은 남기고 비밀번호에 포커스", () => {
    renderForm(undefined, { initialState: invalid() });
    const message = "이메일 또는 비밀번호가 올바르지 않습니다.";
    expect(screen.getByRole("status")).toHaveTextContent(message);
    for (const label of ["이메일", "비밀번호"]) {
      expect(screen.getByLabelText(label)).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(screen.getByLabelText(label)).toHaveAccessibleDescription(message);
    }
    expect(screen.getByLabelText("이메일")).toHaveValue("admin@example.com");
    expect(screen.getByLabelText("비밀번호")).toHaveValue("");
    expect(screen.getByLabelText("비밀번호")).toHaveFocus();
  });

  it("빈 이메일로 실패하면 이메일에 포커스", () => {
    renderForm(undefined, {
      initialState: { status: "error", code: "required", email: "" },
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "이메일과 비밀번호를 입력해 주세요.",
    );
    expect(screen.getByLabelText("이메일")).toHaveFocus();
  });

  it("제출 중에는 버튼이 aria-disabled 이고 다시 눌러도 한 번만 보낸다", async () => {
    const user = userEvent.setup();
    let resolve!: (state: AdminLoginState) => void;
    const { action } = renderForm(
      vi.fn<Action>(() => new Promise((r) => (resolve = r))),
    );
    await user.type(screen.getByLabelText("이메일"), "admin@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "wrong");
    const button = screen.getByRole("button", { name: "로그인" });
    await user.click(button);
    await waitFor(() =>
      expect(button).toHaveAttribute("aria-disabled", "true"),
    );
    expect(screen.getByRole("status")).toHaveTextContent("로그인하는 중");
    await user.click(button);
    await user.type(screen.getByLabelText("비밀번호"), "{Enter}");
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => resolve(invalid()));
    await waitFor(() => expect(button).not.toHaveAttribute("aria-disabled"));
    expect(screen.getByLabelText("비밀번호")).toHaveValue("");
    expect(screen.getByLabelText("비밀번호")).toHaveFocus();
  });
});
