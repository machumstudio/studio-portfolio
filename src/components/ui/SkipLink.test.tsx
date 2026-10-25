import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SkipLink } from "./SkipLink";

describe("SkipLink", () => {
  it("본문(#main)으로 가는 링크이고, 처음 Tab 에 포커스된다", async () => {
    render(
      <>
        <SkipLink>본문 바로가기</SkipLink>
        <button type="button">메뉴</button>
      </>,
    );
    const link = screen.getByRole("link", { name: "본문 바로가기" });
    expect(link).toHaveAttribute("href", "#main");
    await userEvent.tab();
    expect(link).toHaveFocus();
  });

  it("평소에는 화면에서 숨기고 키보드 포커스에서만 보인다", () => {
    render(<SkipLink href="#content">Skip to content</SkipLink>);
    const link = screen.getByRole("link", { name: "Skip to content" });
    expect(link).toHaveAttribute("href", "#content");
    expect(link).toHaveClass("sr-only", "focus-visible:not-sr-only");
  });
});
