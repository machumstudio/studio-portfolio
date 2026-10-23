import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WorkDetail } from "./WorkDetail";

const photo = { src: "/images/placeholder.svg", alt: "" };

const meta = {
  title: "Sections/WorkDetail",
  component: WorkDetail,
  args: {
    title: "A Wedding Tale",
    category: "events",
    date: "2021-09",
    cover: photo,
    images: [photo, photo, photo, photo],
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof WorkDetail>;

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
