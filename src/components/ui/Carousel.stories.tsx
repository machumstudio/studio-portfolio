import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Carousel } from "./Carousel";

const slides = Array.from({ length: 6 }, (_, i) => i + 1);

const meta = {
  title: "UI/Carousel",
  component: Carousel,
  args: {
    labelledBy: "carousel-title",
    previousLabel: "Previous",
    nextLabel: "Next",
    slideLabels: slides.map((n) => `${n} of ${slides.length}`),
    header: (
      <h2 id="carousel-title" className="text-h1 uppercase">
        Carousel
      </h2>
    ),
    className: "page-x py-10",
    children: slides.map((n) => (
      <div
        key={n}
        className="flex h-60 w-full items-center justify-center rounded-10 border border-dark-12 bg-dark-06 text-h2"
      >
        {n}
      </div>
    )),
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};

// 다음 화살표를 누르면 스크롤이 움직이고 이전 화살표가 켜진다
export const Laptop: Story = {
  globals: { viewport: { value: "laptop", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const previous = canvas.getByRole("button", { name: "Previous" });
    await expect(previous).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(previous).toHaveAttribute("aria-disabled", "false"),
    );
  },
};
