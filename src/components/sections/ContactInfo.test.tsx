import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/ko.json";
import { ContactInfo } from "./ContactInfo";

const renderInfo = () =>
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <ContactInfo phone="+00 000-0000" email="hello@example.com" />
    </NextIntlClientProvider>,
  );

describe("ContactInfo", () => {
  it("제목이 섹션 이름이 된다", () => {
    renderInfo();
    expect(
      screen.getByRole("region", { name: "연락처 정보" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "연락처 정보" }),
    ).toBeInTheDocument();
  });

  it("전화는 숫자만 남긴 tel:, 이메일은 mailto: 링크이고 종류를 함께 읽는다", () => {
    renderInfo();
    expect(
      screen.getByRole("link", { name: "전화: +00 000-0000" }),
    ).toHaveAttribute("href", "tel:+000000000");
    expect(
      screen.getByRole("link", { name: "이메일: hello@example.com" }),
    ).toHaveAttribute("href", "mailto:hello@example.com");
  });
});
