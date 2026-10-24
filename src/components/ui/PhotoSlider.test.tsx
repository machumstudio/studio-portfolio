import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PhotoSlider } from "./PhotoSlider";

const images = [
  { src: "/images/a.jpg", alt: "스튜디오 인물 사진" },
  { src: "/images/b.jpg", alt: "야외 가족 사진" },
  { src: "/images/c.jpg", alt: "커플 사진" },
];

const renderSlider = () =>
  render(
    <PhotoSlider
      images={images}
      label="인물 촬영 사진"
      previousLabel="이전 인물 촬영 사진"
      nextLabel="다음 인물 촬영 사진"
      slideLabels={["1 / 3", "2 / 3", "3 / 3"]}
      sizes="100vw"
      photoClassName="h-57.25"
    />,
  );

describe("PhotoSlider", () => {
  it("carousel 묶음 안에 사진마다 slide 그룹을 두고 첫 장만 보인다", () => {
    renderSlider();
    const carousel = screen.getByRole("group", { name: "인물 촬영 사진" });
    expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
    const slides = within(carousel).getAllByRole("group", { hidden: true });
    expect(slides.map((s) => s.getAttribute("aria-label"))).toEqual([
      "1 / 3",
      "2 / 3",
      "3 / 3",
    ]);
    expect(slides.map((s) => s.hidden)).toEqual([false, true, true]);
    expect(
      screen.getByRole("img", { name: "스튜디오 인물 사진" }),
    ).toBeVisible();
  });

  it("화살표로 한 장씩 넘기고 끝에서는 aria-disabled", async () => {
    const user = userEvent.setup();
    renderSlider();
    const previous = screen.getByRole("button", {
      name: "이전 인물 촬영 사진",
    });
    const next = screen.getByRole("button", { name: "다음 인물 촬영 사진" });
    expect(previous).toHaveAttribute("aria-disabled", "true");

    await user.click(next);
    expect(screen.getByRole("img", { name: "야외 가족 사진" })).toBeVisible();
    expect(previous).toHaveAttribute("aria-disabled", "false");

    await user.click(next);
    await user.click(next);
    expect(screen.getByRole("img", { name: "커플 사진" })).toBeVisible();
    expect(next).toHaveAttribute("aria-disabled", "true");

    await user.click(previous);
    expect(screen.getByRole("img", { name: "야외 가족 사진" })).toBeVisible();
  });

  it("화살표는 사진 묶음을 가리키고 Tab 순서에서 사진보다 앞이다", () => {
    renderSlider();
    const next = screen.getByRole("button", { name: "다음 인물 촬영 사진" });
    const photos = document.getElementById(next.getAttribute("aria-controls")!);
    expect(photos).toHaveAttribute("aria-live", "polite");
    expect(
      next.compareDocumentPosition(photos!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
