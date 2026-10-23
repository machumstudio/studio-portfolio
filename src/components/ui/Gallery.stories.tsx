import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Gallery } from "./Gallery";

const images = Array.from({ length: 5 }, () => ({
  src: "/images/placeholder.svg",
  alt: "",
}));

const meta = {
  title: "UI/Gallery",
  component: Gallery,
  args: {
    images,
    openLabels: images.map((_, i) => `View photo ${i + 1} larger`),
    lightbox: {
      label: "Faces of Resilience photos",
      closeLabel: "Close",
      previousLabel: "Previous photo",
      nextLabel: "Next photo",
      positionLabels: images.map((_, i) => `${i + 1} of ${images.length}`),
    },
    className: "page-x py-10",
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Gallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
export const Laptop: Story = {
  globals: { viewport: { value: "laptop", isRotated: false } },
};

// 썸네일을 누르면 Lightbox 가 열리고, → 키로 넘긴다
export const Opened: Story = {
  globals: { viewport: { value: "laptop", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "View photo 2 larger" }),
    );
    const dialog = within(canvasElement.ownerDocument.body).getByRole(
      "dialog",
      { name: "Faces of Resilience photos" },
    );
    await expect(
      within(dialog).getByRole("button", { name: "Close" }),
    ).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(within(dialog).getByText("3 of 5")).toBeVisible();
  },
};
