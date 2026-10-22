import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HighlightItem } from "./HighlightItem";

const meta = {
  title: "UI/HighlightItem",
  component: HighlightItem,
  args: { children: "Includes a 2-hour photoshoot session" },
  decorators: [
    (Story) => (
      <ul>
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof HighlightItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongText: Story = {
  args: {
    children:
      "Includes full-day coverage, a second photographer, and an online gallery for sharing",
  },
};

export const List: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-5xl page-x py-10">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <ul className="flex flex-col gap-2.5">
      {[
        "Ideal for capturing your unique personality",
        "Includes a 2-hour photoshoot session",
        "Additional images can be purchased separately",
        "Quick turnaround to relive the day's highlights",
      ].map((text) => (
        <HighlightItem key={text}>{text}</HighlightItem>
      ))}
    </ul>
  ),
};

export const Mobile: Story = {
  ...List,
  globals: { viewport: { value: "mobile", isRotated: false } },
};

export const Laptop: Story = {
  ...List,
  globals: { viewport: { value: "laptop", isRotated: false } },
};

export const Desktop: Story = {
  ...List,
  globals: { viewport: { value: "desktop", isRotated: false } },
};
