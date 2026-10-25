import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CategoryMarquee } from "./CategoryMarquee";

const meta = {
  title: "UI/CategoryMarquee",
  component: CategoryMarquee,
  args: {
    label: "Photography categories",
    pauseLabel: "Pause the banner",
    items: [
      "Event Photography",
      "Commercial Photography",
      "Product Photography",
      "Wedding Photography",
      "Landscape Photography",
      "Branding Photography",
      "Portrait Photography",
    ],
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CategoryMarquee>;

export default meta;
type Story = StoryObj<typeof meta>;

// 운영체제의 "동작 줄이기"를 켜면 멈춘다 (prefers-reduced-motion)
export const Default: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};

export const Laptop: Story = {
  globals: { viewport: { value: "laptop", isRotated: false } },
};

export const Desktop: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
};
