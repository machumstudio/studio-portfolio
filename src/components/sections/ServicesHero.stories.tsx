import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ServicesHero } from "./ServicesHero";

const meta = {
  title: "Sections/ServicesHero",
  component: ServicesHero,
  args: { image: { src: "/images/placeholder.svg", alt: "" } },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ServicesHero>;

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
