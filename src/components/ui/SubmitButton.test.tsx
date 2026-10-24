import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SubmitButton } from "./SubmitButton";

describe("SubmitButton", () => {
  it("제출 버튼이고, 보내는 동안 글자가 바뀌고 aria-disabled, 다시 눌러도 보내지 않는다", async () => {
    let finish = () => {};
    const action = vi.fn(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    render(
      <form action={action}>
        <SubmitButton pendingLabel="바꾸는 중…">확인으로 표시</SubmitButton>
      </form>,
    );
    const button = screen.getByRole("button", { name: "확인으로 표시" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).not.toHaveAttribute("aria-disabled");

    await act(async () => fireEvent.click(button));
    const pending = screen.getByRole("button", { name: "바꾸는 중…" });
    expect(pending).toHaveAttribute("aria-disabled", "true");
    await act(async () => fireEvent.click(pending));
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => finish());
    expect(
      screen.getByRole("button", { name: "확인으로 표시" }),
    ).not.toHaveAttribute("aria-disabled");
  });
});
