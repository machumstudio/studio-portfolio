import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FaqAccordion, type FaqItem } from "./FaqAccordion";

const items: FaqItem[] = [
  { id: "a", question: "질문 A", answer: "답 A" },
  { id: "b", question: "질문 B", answer: "답 B" },
  { id: "c", question: "질문 C", answer: "답 C" },
  { id: "d", question: "질문 D", answer: "답 D" },
];

const header = (name: string) => screen.getByRole("button", { name });
const panelOf = (button: HTMLElement) =>
  document.getElementById(button.getAttribute("aria-controls")!)!;

describe("FaqAccordion", () => {
  it("헤더 button 은 제목 안에 있고 aria-controls 로 region 을, region 은 aria-labelledby 로 헤더를 가리킨다", () => {
    render(<FaqAccordion items={items} headingLevel={3} />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual([
      "질문 A",
      "질문 B",
      "질문 C",
      "질문 D",
    ]);
    const button = header("질문 A");
    expect(headings[0]).toContainElement(button);
    const panel = panelOf(button);
    expect(panel).toHaveAttribute("role", "region");
    expect(panel).toHaveAttribute("aria-labelledby", button.id);
    expect(panel).toHaveAccessibleName("질문 A");
  });

  it("닫힌 패널은 aria-expanded=false + inert, 펼치면 true 이고 inert 가 빠진다", async () => {
    const user = userEvent.setup();
    render(<FaqAccordion items={items} />);
    const button = header("질문 B");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(panelOf(button)).toHaveAttribute("inert");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(panelOf(button)).not.toHaveAttribute("inert");
    expect(screen.getByRole("region", { name: "질문 B" })).toHaveTextContent(
      "답 B",
    );

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("Enter 와 Space 로 펼치고 접는다", async () => {
    const user = userEvent.setup();
    render(<FaqAccordion items={items} />);
    await user.tab();
    expect(header("질문 A")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(header("질문 A")).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(header("질문 A")).toHaveAttribute("aria-expanded", "false");
  });

  it("위/아래 화살표는 헤더 사이를 돌고, Home/End 는 처음/끝으로 간다", async () => {
    const user = userEvent.setup();
    render(<FaqAccordion items={items} columns={2} />);
    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(header("질문 B")).toHaveFocus();
    // 2열이어도 DOM 순서로 이어진다 (왼쪽 열 끝 → 오른쪽 열 처음)
    await user.keyboard("{ArrowDown}");
    expect(header("질문 C")).toHaveFocus();
    await user.keyboard("{End}");
    expect(header("질문 D")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(header("질문 A")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(header("질문 D")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(header("질문 A")).toHaveFocus();
  });

  it("화살표 이동은 펼침 상태를 바꾸지 않는다", async () => {
    const user = userEvent.setup();
    render(<FaqAccordion items={items} />);
    await user.tab();
    await user.keyboard("{ArrowDown}{End}{Home}");
    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("기본은 하나만 펼친다: 다른 항목을 펼치면 앞의 것이 닫힌다", async () => {
    const user = userEvent.setup();
    render(<FaqAccordion items={items} defaultOpen={["a"]} />);
    expect(header("질문 A")).toHaveAttribute("aria-expanded", "true");
    await user.click(header("질문 C"));
    expect(header("질문 C")).toHaveAttribute("aria-expanded", "true");
    expect(header("질문 A")).toHaveAttribute("aria-expanded", "false");
  });

  it("multiple 이면 여러 개를 함께 펼친다", async () => {
    const user = userEvent.setup();
    render(<FaqAccordion items={items} multiple defaultOpen={["a"]} />);
    await user.click(header("질문 C"));
    expect(header("질문 A")).toHaveAttribute("aria-expanded", "true");
    expect(header("질문 C")).toHaveAttribute("aria-expanded", "true");
  });
});
