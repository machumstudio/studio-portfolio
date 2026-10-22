import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArrowUpRight, ChevronLeft } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { Button, buttonStyles } from "./Button";

describe("Button", () => {
  it("기본은 type=button 인 primary 버튼이다", () => {
    render(<Button>문의하기</Button>);
    const button = screen.getByRole("button", { name: "문의하기" });
    expect(button).toHaveAttribute("type", "button");
    expect(button.className).toContain("bg-purple-55");
  });

  it("outline 은 surface-raised 표면을 쓴다", () => {
    render(<Button variant="outline">더 보기</Button>);
    expect(screen.getByRole("button", { name: "더 보기" }).className).toContain(
      "surface-raised",
    );
  });

  it("아이콘만 있는 버튼은 aria-label 이 접근 가능한 이름이 되고 아이콘은 숨긴다", () => {
    render(
      <>
        <Button aria-label="문의하기">
          <ArrowUpRight />
        </Button>
        <Button variant="icon" size="lg" aria-label="이전">
          <ChevronLeft />
        </Button>
      </>,
    );
    expect(
      screen.getByRole("button", { name: "문의하기" }),
    ).toBeInTheDocument();
    const prev = screen.getByRole("button", { name: "이전" });
    expect(prev.className).toContain("size-12");
    expect(prev.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("Tab 으로 순서대로 포커스되고, 비활성 버튼은 건너뛰며, Enter/Space 로 누를 수 있다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <>
        <Button onClick={onClick}>첫째</Button>
        <Button disabled>비활성</Button>
        <Button variant="outline">셋째</Button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "첫째" })).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
    await user.tab();
    expect(screen.getByRole("button", { name: "셋째" })).toHaveFocus();
  });

  it("buttonStyles 로 링크에도 같은 모양을 입힌다", () => {
    render(
      <a href="#contact" className={buttonStyles({ variant: "outline" })}>
        연락하기
      </a>,
    );
    expect(screen.getByRole("link", { name: "연락하기" }).className).toContain(
      "surface-raised",
    );
  });
});
