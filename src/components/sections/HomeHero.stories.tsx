import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HomeHero, heroPhotoCount } from "./HomeHero";

const meta = {
  title: "Sections/HomeHero",
  component: HomeHero,
  args: {
    photos: Array.from({ length: heroPhotoCount }, () => ({
      src: "/images/placeholder.svg",
      alt: "",
    })),
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HomeHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
export const Laptop: Story = {
  globals: { viewport: { value: "laptop", isRotated: false } },
};
export const Desktop: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
};
