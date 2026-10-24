import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ContactInfo } from "./ContactInfo";

const meta = {
  title: "Sections/ContactInfo",
  component: ContactInfo,
  args: { phone: "+00 000000000", email: "hello@example.com" },
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="page-x">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContactInfo>;

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
