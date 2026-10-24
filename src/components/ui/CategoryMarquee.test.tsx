import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CategoryMarquee } from "./CategoryMarquee";

const items = ["웨딩 촬영", "인물 촬영", "제품 촬영"];

describe("CategoryMarquee", () => {
  it("이름 붙은 목록 하나로 항목을 한 번씩만 읽힌다 (반복과 두 번째 벌은 숨김)", () => {
    render(<CategoryMarquee items={items} label="촬영 분야" />);
    const list = screen.getByRole("list", { name: "촬영 분야" });
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(items);
    // 보조기기 트리에는 목록이 하나뿐이다
    expect(screen.getAllByRole("list")).toHaveLength(1);
    // 화면을 채우려고 한 줄에 3번, 두 벌 = 6번 그린다
    expect(screen.getAllByText("웨딩 촬영")).toHaveLength(6);
  });

  it("움직임은 motion-safe 에서만 켠다 (prefers-reduced-motion: reduce 이면 정지)", () => {
    render(<CategoryMarquee items={items} label="촬영 분야" />);
    const track = screen.getByTestId("marquee-track");
    const classes = track.className.split(" ");
    expect(classes).toContain("motion-safe:animate-marquee");
    // 조건 없는 animate-* 가 있으면 reduce 에서도 움직인다
    expect(classes.filter((c) => c.startsWith("animate-"))).toEqual([]);
  });

  it("장식 아이콘은 숨기고 Tab 포커스를 받지 않는다", async () => {
    const user = userEvent.setup();
    render(
      <>
        <CategoryMarquee items={items} label="촬영 분야" />
        <button type="button">다음</button>
      </>,
    );
    for (const svg of screen.getByRole("list").querySelectorAll("svg")) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
    await user.tab();
    expect(screen.getByRole("button", { name: "다음" })).toHaveFocus();
  });

  it("itemLang 을 주면 항목에 lang 을 붙이고 목록 이름은 화면 언어 그대로다", () => {
    render(
      <CategoryMarquee
        items={["Wedding Photography"]}
        label="촬영 분야"
        itemLang="en"
      />,
    );
    const list = screen.getByRole("list", { name: "촬영 분야" });
    expect(list).not.toHaveAttribute("lang");
    for (const li of list.querySelectorAll("li"))
      expect(li).toHaveAttribute("lang", "en");
  });
});
