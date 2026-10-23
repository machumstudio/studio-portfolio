import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WorkPager } from "./WorkPager";

const meta = {
  title: "Sections/WorkPager",
  component: WorkPager,
  args: {
    previous: {
      slug: "elegance-in-monochrome",
      title: "Elegance in Monochrome",
    },
    next: { slug: "a-wedding-tale", title: "A Wedding Tale" },
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof WorkPager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
export const Laptop: Story = {
  globals: { viewport: { value: "laptop", isRotated: false } },
};
// 첫 작업: 다음만 (오른쪽 칸)
export const FirstWork: Story = {
  args: { previous: null },
  globals: { viewport: { value: "laptop", isRotated: false } },
};
