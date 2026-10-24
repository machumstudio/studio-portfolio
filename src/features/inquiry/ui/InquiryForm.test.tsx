import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/en.json";
import type { InquiryFormState } from "../form-state";
import { InquiryForm } from "./InquiryForm";

const values = {
  firstName: "Sky",
  lastName: "",
  email: "nope",
  phone: "",
  message: "",
};

const invalid: InquiryFormState = {
  status: "invalid",
  values,
  errors: {
    lastName: { code: "required" },
    email: { code: "invalidEmail" },
    message: { code: "required" },
  },
};

const renderForm = (
  action = vi.fn<
    (s: InquiryFormState, f: FormData) => Promise<InquiryFormState>
  >(async () => ({ status: "success" })),
  initialState?: InquiryFormState,
) => {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <InquiryForm action={action} initialState={initialState} />
    </NextIntlClientProvider>,
  );
  return action;
};

const fill = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("First Name"), "Sky");
  await user.type(screen.getByLabelText("Last Name"), "Kim");
  await user.type(screen.getByLabelText("Email"), "sky@example.com");
  await user.type(screen.getByLabelText("Your Message"), "Hello");
};

describe("InquiryForm", () => {
  it("다섯 칸이 라벨로 이어지고, 연락처만 선택 항목이다", () => {
    renderForm();
    const form = screen.getByRole("form", { name: "Inquiry form" });
    expect(form).toHaveAttribute("novalidate");
    for (const label of ["First Name", "Last Name", "Email", "Your Message"])
      expect(screen.getByLabelText(label)).toBeRequired();
    const phone = screen.getByLabelText("Phone Number (Optional)");
    expect(phone).not.toBeRequired();
    expect(phone).toHaveAttribute("type", "tel");
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
  });

  it("maxLength 는 domain 한도", () => {
    renderForm();
    expect(screen.getByLabelText("First Name")).toHaveAttribute(
      "maxlength",
      "50",
    );
    expect(screen.getByLabelText("Your Message")).toHaveAttribute(
      "maxlength",
      "2000",
    );
  });

  it("틀린 칸을 모두 표시하고, 입력값을 유지하고, 첫 오류 칸에 포커스한다", () => {
    renderForm(undefined, invalid);
    const lastName = screen.getByLabelText("Last Name");
    expect(lastName).toHaveAttribute("aria-invalid", "true");
    expect(lastName).toHaveAccessibleDescription(
      "Please enter your last name.",
    );
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Please check the email format, e.g. name@example.com.",
    );
    expect(screen.getByLabelText("Your Message")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText("First Name")).not.toHaveAttribute(
      "aria-invalid",
    );
    expect(screen.getByLabelText("First Name")).toHaveValue("Sky");
    expect(screen.getByLabelText("Email")).toHaveValue("nope");
    expect(lastName).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Please check your entries. 3 fields need attention.",
    );
  });

  it("한도 초과 문구에 domain 한도를 넣는다", () => {
    renderForm(undefined, {
      status: "invalid",
      values,
      errors: { message: { code: "tooLong", max: 2000 } },
    });
    expect(screen.getByLabelText("Your Message")).toHaveAccessibleDescription(
      "Message can be up to 2000 characters.",
    );
  });

  it("제출하면 액션에 칸 값이 가고, 성공을 role=status 로 알리고 칸을 비운다", async () => {
    const user = userEvent.setup();
    const action = renderForm();
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Send Message" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Your message has been sent.",
      ),
    );
    const data = action.mock.calls[0][1];
    expect(Object.fromEntries(data)).toEqual({
      firstName: "Sky",
      lastName: "Kim",
      email: "sky@example.com",
      phone: "",
      message: "Hello",
      website: "",
    });
    expect(screen.getByLabelText("First Name")).toHaveValue("");
  });

  it("서버 오류면 입력값을 유지하고 오류를 알린다", async () => {
    const user = userEvent.setup();
    renderForm(
      vi.fn(async (_: InquiryFormState, data: FormData) => ({
        status: "error" as const,
        values: {
          firstName: String(data.get("firstName")),
          lastName: String(data.get("lastName")),
          email: String(data.get("email")),
          phone: String(data.get("phone")),
          message: String(data.get("message")),
        },
      })),
    );
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Send Message" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Something went wrong",
      ),
    );
    expect(screen.getByLabelText("Email")).toHaveValue("sky@example.com");
  });

  it("제출 중에는 버튼이 비활성이고 다시 눌러도 한 번만 보낸다", async () => {
    const user = userEvent.setup();
    let resolve!: (state: InquiryFormState) => void;
    const action = renderForm(
      vi.fn(() => new Promise<InquiryFormState>((r) => (resolve = r))),
    );
    await fill(user);
    const button = screen.getByRole("button", { name: "Send Message" });
    await user.click(button);
    await waitFor(() =>
      expect(button).toHaveAttribute("aria-disabled", "true"),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Sending");
    await user.click(button);
    await user.type(screen.getByLabelText("Your Message"), "{Enter}");
    expect(action).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ status: "success" }));
    await waitFor(() => expect(button).not.toHaveAttribute("aria-disabled"));
  });

  it("허니팟 칸은 보조기기와 Tab 에서 빠진다", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <InquiryForm action={async () => ({ status: "idle" })} />
      </NextIntlClientProvider>,
    );
    const honeypot = container.querySelector('input[name="website"]');
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot?.closest("[aria-hidden]")).not.toBeNull();
    expect(
      screen.queryByRole("textbox", { name: "Leave this field empty" }),
    ).toBeNull();
    for (let i = 0; i < 6; i++) await user.tab();
    expect(screen.getByRole("button", { name: "Send Message" })).toHaveFocus();
  });
});
