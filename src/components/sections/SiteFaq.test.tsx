import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/ko.json";
import { SiteFaq } from "./SiteFaq";

const items = Object.entries(messages.Faq.items).map(([id, item]) => ({
  id,
  ...item,
}));

const renderFaq = () =>
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <SiteFaq items={items} defaultOpen={["specialty", "prints"]} />
    </NextIntlClientProvider>,
  );

describe("SiteFaq", () => {
  it("섹션은 h2 제목으로 이름 붙고, 질문은 그 아래 h3 다", () => {
    renderFaq();
    const section = screen.getByRole("region", {
      name: "궁금한 점을 모았어요",
    });
    expect(within(section).getAllByRole("heading", { level: 3 })).toHaveLength(
      8,
    );
  });

  it("시안처럼 두 항목(각 열 하나씩)을 함께 펼쳐 둔다", () => {
    renderFaq();
    const expanded = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-expanded") === "true");
    expect(expanded.map((b) => b.textContent)).toEqual([
      messages.Faq.items.specialty.question,
      messages.Faq.items.prints.question,
    ]);
  });
});
