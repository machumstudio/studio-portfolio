import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HomePortfolio } from "./HomePortfolio";

const image = { src: "/images/placeholder.svg", alt: "" };

const meta = {
  title: "Sections/HomePortfolio",
  component: HomePortfolio,
  args: {
    items: [
      {
        slug: "faces-of-resilience",
        title: "단단한 얼굴들",
        date: "2022-03",
        image,
      },
      {
        slug: "a-wedding-tale",
        title: "어느 결혼식 이야기",
        date: "2020-01",
        image,
      },
      {
        slug: "product-elegance",
        title: "제품의 품격",
        date: "2020-01",
        image,
      },
    ],
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HomePortfolio>;

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
