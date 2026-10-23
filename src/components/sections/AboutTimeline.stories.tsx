import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AboutTimeline } from "./AboutTimeline";

const meta = {
  title: "Sections/AboutTimeline",
  component: AboutTimeline,
  args: {
    items: [
      {
        year: 2005,
        body: "We acquired our first camera, igniting a passion for photography, experimenting with landscapes and candid shots and beginning our visual storytelling.",
      },
      {
        year: 2010,
        body: "We studied visual arts with a focus on photography, refining our technical skills and artistic sensibilities.",
      },
      {
        year: 2012,
        body: "We held our first solo exhibition, showcasing a unique perspective on nature and people through our lens.",
      },
      {
        year: 2015,
        body: "Machum Studio officially launched, offering portrait, event, and commercial photography services.",
      },
    ],
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AboutTimeline>;

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
