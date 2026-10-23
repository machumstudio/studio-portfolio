import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PhotoCutFooter } from "./PhotoCut";

// 사진 아래 줄만. 사진 위에 올렸을 때 모양은 Sections/PortfolioHero, Sections/AboutHero 에서 본다
const meta = {
  title: "UI/PhotoCutFooter",
  component: PhotoCutFooter,
  args: { scrollLabel: "Scroll down to see my works" },
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="bg-dark-15 page-x">
      <PhotoCutFooter {...args} />
    </div>
  ),
} satisfies Meta<typeof PhotoCutFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Laptop: Story = {
  globals: { viewport: { value: "laptop", isRotated: false } },
};
export const Desktop: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
};
