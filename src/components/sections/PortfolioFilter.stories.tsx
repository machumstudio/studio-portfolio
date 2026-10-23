import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PortfolioFilter } from "./PortfolioFilter";

const meta = {
  title: "Sections/PortfolioFilter",
  component: PortfolioFilter,
  args: {
    categories: ["portrait", "events", "commercial"],
    selected: null,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PortfolioFilter>;

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
// ?category=events
export const Selected: Story = {
  args: { selected: "events" },
  globals: { viewport: { value: "laptop", isRotated: false } },
};
