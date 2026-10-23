import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { Gallery } from "./Gallery";

// jsdom 에는 showModal 이 없다. 브라우저처럼 open 을 켜고, close() 는 open 을 끄고 close 이벤트를 보낸다
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    if (!this.open) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

const images = [1, 2, 3].map((n) => ({
  src: `/images/${n}.jpg`,
  alt: `사진 설명 ${n}`,
}));

const renderGallery = () =>
  render(
    <Gallery
      images={images}
      openLabels={images.map((_, i) => `사진 ${i + 1} 크게 보기`)}
      lightbox={{
        label: "단단한 얼굴들 사진",
        closeLabel: "닫기",
        previousLabel: "이전 사진",
        nextLabel: "다음 사진",
        positionLabels: images.map((_, i) => `${i + 1} / 3`),
      }}
    />,
  );

const dialog = () => screen.getByRole("dialog", { hidden: true });
const position = () => dialog().querySelector("[aria-live]")?.textContent;

describe("Gallery + Lightbox", () => {
  it("썸네일은 다이얼로그를 여는 버튼이고, 처음에는 닫혀 있다", () => {
    renderGallery();
    const thumbs = screen.getAllByRole("button", { name: /크게 보기$/ });
    expect(thumbs).toHaveLength(3);
    expect(thumbs[0]).toHaveAttribute("aria-haspopup", "dialog");
    expect(dialog()).not.toHaveAttribute("open");
  });

  it("누르면 그 사진으로 열리고 닫기 버튼에 포커스가 간다 (모달 다이얼로그)", async () => {
    renderGallery();
    await userEvent.click(
      screen.getByRole("button", { name: "사진 2 크게 보기" }),
    );
    expect(dialog()).toHaveAttribute("open");
    expect(dialog()).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("dialog", { name: "단단한 얼굴들 사진" })).toBe(
      dialog(),
    );
    expect(position()).toBe("2 / 3");
    expect(
      within(dialog()).getByRole("img", { name: "사진 설명 2" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "닫기" })).toHaveFocus();
  });

  it("→/← 키와 이전/다음 버튼으로 넘기고, 끝에서는 처음/끝으로 돈다", async () => {
    renderGallery();
    await userEvent.click(
      screen.getByRole("button", { name: "사진 1 크게 보기" }),
    );
    await userEvent.keyboard("{ArrowLeft}");
    expect(position()).toBe("3 / 3");
    await userEvent.keyboard("{ArrowRight}");
    expect(position()).toBe("1 / 3");
    await userEvent.click(screen.getByRole("button", { name: "다음 사진" }));
    expect(position()).toBe("2 / 3");
    await userEvent.click(screen.getByRole("button", { name: "이전 사진" }));
    expect(position()).toBe("1 / 3");
  });

  it("Tab/Shift+Tab 은 다이얼로그 안(닫기 → 이전 → 다음)에서 돈다", async () => {
    renderGallery();
    await userEvent.click(
      screen.getByRole("button", { name: "사진 1 크게 보기" }),
    );
    const close = screen.getByRole("button", { name: "닫기" });
    const next = screen.getByRole("button", { name: "다음 사진" });
    await userEvent.tab();
    await userEvent.tab();
    expect(next).toHaveFocus();
    await userEvent.tab();
    expect(close).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(next).toHaveFocus();
  });

  it("닫기를 누르면 닫히고, 다른 사진으로 넘겼어도 연 썸네일로 포커스가 돌아간다", async () => {
    renderGallery();
    const opener = screen.getByRole("button", { name: "사진 2 크게 보기" });
    await userEvent.click(opener);
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(dialog()).not.toHaveAttribute("open");
    expect(opener).toHaveFocus();
  });

  it("Esc(브라우저가 다이얼로그를 닫음)도 같은 썸네일로 돌아간다", async () => {
    renderGallery();
    const opener = screen.getByRole("button", { name: "사진 3 크게 보기" });
    await userEvent.click(opener);
    act(() => (dialog() as HTMLDialogElement).close());
    expect(opener).toHaveFocus();
    expect(dialog().querySelector("img")).toBeNull();
  });

  it("가로로 50px 이상 밀면 넘기고, 짧게 밀면 그대로다", async () => {
    renderGallery();
    await userEvent.click(
      screen.getByRole("button", { name: "사진 1 크게 보기" }),
    );
    const area = within(dialog()).getByRole("img").parentElement!;
    fireEvent.pointerDown(area, { clientX: 300 });
    fireEvent.pointerUp(area, { clientX: 200 });
    expect(position()).toBe("2 / 3");
    fireEvent.pointerDown(area, { clientX: 100 });
    fireEvent.pointerUp(area, { clientX: 300 });
    expect(position()).toBe("1 / 3");
    fireEvent.pointerDown(area, { clientX: 100 });
    fireEvent.pointerUp(area, { clientX: 130 });
    expect(position()).toBe("1 / 3");
  });

  it("썸네일은 시각 비교에서 가린다", () => {
    renderGallery();
    for (const thumb of screen.getAllByRole("button", {
      name: /크게 보기$/,
    })) {
      expect(thumb).toHaveAttribute("data-visual-mask");
    }
  });
});
