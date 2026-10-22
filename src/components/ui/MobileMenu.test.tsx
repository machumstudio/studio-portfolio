import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MobileMenu } from "./MobileMenu";

const renderMenu = () =>
  render(
    <>
      <a href="#top">로고</a>
      <MobileMenu openLabel="메뉴 열기" closeLabel="메뉴 닫기">
        <nav aria-label="주요 메뉴">
          <a href="#about">소개</a>
          <a href="#portfolio">포트폴리오</a>
          <a href="#contact">문의하기</a>
        </nav>
      </MobileMenu>
      <a href="#after">본문 링크</a>
    </>,
  );

describe("MobileMenu", () => {
  it("버튼으로 열고 닫으며 aria-expanded, aria-controls, 이름이 따라 바뀐다", async () => {
    const user = userEvent.setup();
    renderMenu();
    const button = screen.getByRole("button", { name: "메뉴 열기" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button).toHaveAccessibleName("메뉴 닫기");
    const nav = screen.getByRole("navigation", { name: "주요 메뉴" });
    expect(nav.parentElement).toHaveAttribute(
      "id",
      button.getAttribute("aria-controls"),
    );

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("열면 첫 링크로 포커스가 가고, Esc 로 닫으면 버튼으로 돌아온다", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    expect(screen.getByRole("link", { name: "소개" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveFocus();
  });

  it("키보드(Enter)로도 열 수 있다", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("열려 있는 동안 Tab / Shift+Tab 이 버튼과 패널 안에서만 돈다", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    const close = screen.getByRole("button", { name: "메뉴 닫기" });

    await user.tab(); // 포트폴리오
    await user.tab(); // 문의하기 (마지막)
    expect(screen.getByRole("link", { name: "문의하기" })).toHaveFocus();
    await user.tab(); // 처음(토글 버튼)으로 돌아온다. 본문 링크로 나가지 않는다
    expect(close).toHaveFocus();
    await user.tab({ shift: true }); // 거꾸로 가면 마지막으로
    expect(screen.getByRole("link", { name: "문의하기" })).toHaveFocus();
  });

  it("패널의 링크를 누르면 닫히고, 닫히면 body 스크롤 잠금이 풀린다", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    expect(document.body.style.overflow).toBe("hidden");

    await user.click(screen.getByRole("link", { name: "포트폴리오" }));
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });
});
