import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";
import { SectionHeading } from "./SectionHeading";

describe("SectionHeading", () => {
  it("기본은 h2 제목이고 라벨은 같은 hgroup 안의 문단이다", () => {
    render(<SectionHeading eyebrow="포트폴리오" title="작업 둘러보기" />);
    const heading = screen.getByRole("heading", {
      level: 2,
      name: "작업 둘러보기",
    });
    const label = screen.getByText("포트폴리오");
    expect(label.tagName).toBe("P");
    expect(heading.parentElement).toBe(label.parentElement);
    expect(heading.parentElement!.tagName).toBe("HGROUP");
  });

  it("as 로 제목 수준을 바꾼다", () => {
    render(<SectionHeading as="h1" eyebrow="소개" title="Machum Studio" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Machum Studio" }),
    ).toBeInTheDocument();
  });

  it("id 를 제목에 붙여 section 의 접근 가능한 이름이 된다", () => {
    render(
      <section aria-labelledby="faq-title">
        <SectionHeading id="faq-title" eyebrow="FAQ" title="자주 묻는 질문" />
      </section>,
    );
    expect(
      screen.getByRole("region", { name: "자주 묻는 질문" }),
    ).toBeInTheDocument();
  });

  it("버튼 영역은 제목 다음 Tab 순서로 이동한다", async () => {
    const user = userEvent.setup();
    render(
      <SectionHeading
        eyebrow="포트폴리오"
        title="작업 둘러보기"
        actions={
          <>
            <Button variant="icon" aria-label="이전">
              ‹
            </Button>
            <Button variant="outline">전체 보기</Button>
          </>
        }
      />,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "이전" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "전체 보기" })).toHaveFocus();
  });

  it("divider=false 면 구분선이 없다", () => {
    const { container, rerender } = render(
      <SectionHeading eyebrow="a" title="b" />,
    );
    expect((container.firstChild as HTMLElement).className).toContain(
      "border-b",
    );
    rerender(<SectionHeading eyebrow="a" title="b" divider={false} />);
    expect((container.firstChild as HTMLElement).className).not.toContain(
      "border-b",
    );
  });
});
