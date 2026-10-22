import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tag } from "./Tag";

const meta = {
  title: "UI/Tag",
  component: Tag,
  args: { children: "Includes a 2-hour photoshoot session" },
} satisfies Meta<typeof Tag>;

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
  render: () => (
    <ul className="flex max-w-5xl flex-col gap-2.5 page-x py-10">
      {[
        "Ideal for capturing your unique personality",
        "Includes a 2-hour photoshoot session",
        "Additional images can be purchased separately",
        "Quick turnaround to relive the day's highlights",
      ].map((text) => (
        <li key={text}>
          <Tag>{text}</Tag>
        </li>
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
