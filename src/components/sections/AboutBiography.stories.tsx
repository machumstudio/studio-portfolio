import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AboutBiography } from "./AboutBiography";

const meta = {
  title: "Sections/AboutBiography",
  component: AboutBiography,
  args: {
    paragraphs: [
      "Machum Studio's love affair with photography began early, nurtured by seaside towns and the people of busy market streets.",
      "Driven by curiosity to find beauty in everyday moments, we have honed our craft step by step.",
      "With each click of the shutter, we weave stories that transcend time and space.",
    ],
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AboutBiography>;

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
