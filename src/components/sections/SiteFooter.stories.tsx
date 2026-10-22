import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteCta } from "./SiteCta";
import { SiteFooter } from "./SiteFooter";

const meta = {
  title: "Sections/SiteFooter",
  component: SiteFooter,
  args: { cta: <SiteCta />, year: 2026 },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SiteFooter>;

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
