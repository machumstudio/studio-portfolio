import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteCta } from "./SiteCta";

const meta = {
  title: "Sections/SiteCta",
  component: SiteCta,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="page-x py-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SiteCta>;

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
