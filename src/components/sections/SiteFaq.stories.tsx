import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import messages from "../../../messages/ko.json";
import { SiteFaq } from "./SiteFaq";

const meta = {
  title: "Sections/SiteFaq",
  component: SiteFaq,
  args: {
    items: Object.entries(messages.Faq.items).map(([id, item]) => ({
      id,
      ...item,
    })),
    defaultOpen: ["specialty", "prints"],
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SiteFaq>;

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
