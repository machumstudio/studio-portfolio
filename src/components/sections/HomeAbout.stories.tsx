import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HomeAbout } from "./HomeAbout";

const meta = {
  title: "Sections/HomeAbout",
  component: HomeAbout,
  args: {
    photo: { src: "/images/placeholder.svg", alt: "" },
    email: "hello@example.com",
    phone: "+00 000000000",
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HomeAbout>;

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
