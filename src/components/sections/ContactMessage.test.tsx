import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/ko.json";
import { ContactMessage } from "./ContactMessage";

describe("ContactMessage", () => {
  it("제목이 섹션 이름이고, 받은 폼을 그 안에 둔다", () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages}>
        <ContactMessage form={<form aria-label="문의 양식" />} />
      </NextIntlClientProvider>,
    );
    const section = screen.getByRole("region", { name: "메시지 보내기" });
    expect(section).toHaveAttribute("id", "message");
    expect(section).toContainElement(
      screen.getByRole("form", { name: "문의 양식" }),
    );
  });
});
