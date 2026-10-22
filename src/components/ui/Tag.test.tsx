import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tag } from "./Tag";

describe("Tag", () => {
  it("글자를 보여주고 장식 아이콘은 보조기기에서 숨긴다", () => {
    render(<Tag>2시간 촬영 포함</Tag>);
    const tag = screen.getByText("2시간 촬영 포함").parentElement!;
    expect(tag).toHaveTextContent("2시간 촬영 포함");
    expect(tag.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("목록 안에서 항목 이름으로 읽힌다", () => {
    render(
      <ul>
        <li>
          <Tag>보정본 50장</Tag>
        </li>
      </ul>,
    );
    expect(screen.getByRole("listitem")).toHaveTextContent("보정본 50장");
  });

  it("상호작용 요소가 아니라 Tab 포커스를 받지 않는다", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Tag>하이라이트</Tag>
        <button type="button">다음</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "다음" })).toHaveFocus();
  });

  it("className 을 덧붙일 수 있다", () => {
    render(<Tag className="w-full">전체 폭</Tag>);
    expect(screen.getByText("전체 폭").parentElement!.className).toContain(
      "w-full",
    );
  });
});
