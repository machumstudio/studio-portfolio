import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { HighlightItem } from "./HighlightItem";

const renderInList = (ui: ReactNode) => render(<ul>{ui}</ul>);

describe("HighlightItem", () => {
  it("목록 항목으로 렌더하고 장식 아이콘은 보조기기에서 숨긴다", () => {
    renderInList(<HighlightItem>2시간 촬영 포함</HighlightItem>);
    const item = screen.getByRole("listitem");
    expect(item).toHaveTextContent("2시간 촬영 포함");
    expect(item.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("부모 목록의 항목 수에 그대로 잡힌다", () => {
    renderInList(
      <>
        <HighlightItem>보정본 50장</HighlightItem>
        <HighlightItem>원본 제공</HighlightItem>
      </>,
    );
    expect(screen.getByRole("list")).toContainElement(
      screen.getAllByRole("listitem")[1],
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("상호작용 요소가 아니라 Tab 포커스를 받지 않는다", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ul>
          <HighlightItem>하이라이트</HighlightItem>
        </ul>
        <button type="button">다음</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "다음" })).toHaveFocus();
  });

  it("className 을 덧붙일 수 있다", () => {
    renderInList(<HighlightItem className="w-full">전체 폭</HighlightItem>);
    expect(screen.getByRole("listitem").className).toContain("w-full");
  });
});
