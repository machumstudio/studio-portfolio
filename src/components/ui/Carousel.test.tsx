import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Carousel } from "./Carousel";

const renderCarousel = () =>
  render(
    <Carousel
      labelledBy="t"
      previousLabel="이전 후기"
      nextLabel="다음 후기"
      slideLabels={["1 / 3", "2 / 3", "3 / 3"]}
      header={<h2 id="t">고객 후기</h2>}
    >
      <p>첫째</p>
      <p>둘째</p>
      <p>셋째</p>
    </Carousel>,
  );

// jsdom 은 레이아웃이 없어 스크롤 위치와 크기를 직접 정한다
const setScroll = (
  track: HTMLElement,
  {
    left,
    client = 300,
    width = 900,
  }: { left: number; client?: number; width?: number },
) => {
  Object.defineProperty(track, "scrollLeft", {
    value: left,
    configurable: true,
  });
  Object.defineProperty(track, "clientWidth", {
    value: client,
    configurable: true,
  });
  Object.defineProperty(track, "scrollWidth", {
    value: width,
    configurable: true,
  });
  fireEvent.scroll(track);
};

afterEach(() => vi.restoreAllMocks());

describe("Carousel", () => {
  it("제목으로 이름 붙은 carousel 이고, 슬라이드마다 'n / 전체' 라벨이 붙는다", () => {
    renderCarousel();
    const carousel = screen.getByRole("region", { name: "고객 후기" });
    expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
    const slides = within(carousel).getAllByRole("group");
    expect(slides.map((s) => s.getAttribute("aria-label"))).toEqual([
      "1 / 3",
      "2 / 3",
      "3 / 3",
    ]);
    for (const slide of slides) {
      expect(slide).toHaveAttribute("aria-roledescription", "slide");
    }
  });

  it("화살표는 이름이 있고 슬라이드 목록을 aria-controls 로 가리키며, Tab 순서가 슬라이드보다 앞이다", async () => {
    const user = userEvent.setup();
    renderCarousel();
    const previous = screen.getByRole("button", { name: "이전 후기" });
    const next = screen.getByRole("button", { name: "다음 후기" });
    const track = document.getElementById(next.getAttribute("aria-controls")!)!;
    expect(track).toContainElement(screen.getByText("첫째"));
    await user.tab();
    expect(previous).toHaveFocus();
    await user.tab();
    expect(next).toHaveFocus();
  });

  it("다음/이전은 슬라이드 한 장 폭만큼 스크롤한다 (reduced-motion 이면 바로)", async () => {
    const user = userEvent.setup();
    const scrollBy = vi.fn();
    Element.prototype.scrollBy = scrollBy;
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(300);
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    renderCarousel();

    await user.click(screen.getByRole("button", { name: "다음 후기" }));
    expect(scrollBy).toHaveBeenLastCalledWith({
      left: 300,
      behavior: "smooth",
    });

    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    await user.click(screen.getByRole("button", { name: "이전 후기" }));
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -300, behavior: "auto" });
  });

  it("처음에는 이전이, 끝에서는 다음이 aria-disabled 다", () => {
    renderCarousel();
    const previous = screen.getByRole("button", { name: "이전 후기" });
    const next = screen.getByRole("button", { name: "다음 후기" });
    const track = document.getElementById(next.getAttribute("aria-controls")!)!;

    setScroll(track, { left: 0 });
    expect(previous).toHaveAttribute("aria-disabled", "true");
    expect(next).toHaveAttribute("aria-disabled", "false");

    setScroll(track, { left: 300 });
    expect(previous).toHaveAttribute("aria-disabled", "false");
    expect(next).toHaveAttribute("aria-disabled", "false");

    setScroll(track, { left: 600 });
    expect(next).toHaveAttribute("aria-disabled", "true");
  });

  it("자동으로 넘어가지 않는다 (타이머를 쓰지 않음)", () => {
    vi.useFakeTimers();
    const scrollBy = vi.fn();
    Element.prototype.scrollBy = scrollBy;
    renderCarousel();
    vi.advanceTimersByTime(60_000);
    expect(scrollBy).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
