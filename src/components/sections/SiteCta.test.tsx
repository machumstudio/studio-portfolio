import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/en.json";
import ko from "../../../messages/ko.json";
import { SiteCta } from "./SiteCta";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: { href: string }) => <a href={href} {...props} />,
}));

const renderCta = (props?: { eyebrow?: boolean }, locale = "en") =>
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "ko" ? ko : messages}
    >
      <SiteCta {...props} />
    </NextIntlClientProvider>,
  );

describe("SiteCta", () => {
  it("버튼이 끼어 있어도 제목은 한 문장으로 읽힌다", () => {
    renderCta();
    expect(
      screen.getByRole("heading", { level: 2, name: "Let’s Work Together" }),
    ).toBeInTheDocument();
  });

  it("알약 버튼은 이름이 있는 문의 페이지 링크이고 Tab 으로 닿는다", async () => {
    const user = userEvent.setup();
    renderCta();
    await user.tab();
    const link = screen.getByRole("link", { name: "Contact Me" });
    expect(link).toHaveFocus();
    expect(link).toHaveAttribute("href", "/contact");
    expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("eyebrow={false} 이면 라벨 없이 제목과 버튼만 그린다", () => {
    renderCta({ eyebrow: false });
    expect(
      screen.queryByText(messages.Layout.cta.eyebrow),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Contact Me" }),
    ).toBeInTheDocument();
  });

  it("ko 화면에서도 두 줄은 장식 영어(lang=en)이고, 제목과 버튼 이름은 한국어로 읽힌다", () => {
    const { container } = renderCta({ eyebrow: false }, "ko");
    const lines = [...container.querySelectorAll("span[aria-hidden]")];
    expect(lines.map((el) => el.textContent)).toEqual([
      "Let’s",
      "Work Together",
    ]);
    for (const el of lines) expect(el).toHaveAttribute("lang", "en");
    expect(
      screen.getByRole("heading", { level: 2, name: "함께 작업해요" }),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "문의하기" });
    expect(link.closest("[lang]")).toBeNull();
  });
});
