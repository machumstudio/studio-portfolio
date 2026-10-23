import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import messages from "../../../messages/ko.json";
import { HomePortfolio } from "./HomePortfolio";

const { items } = messages.Portfolio;
const image = { src: "/images/placeholder.svg", alt: "" };

const meta = {
  title: "Sections/HomePortfolio",
  component: HomePortfolio,
  args: {
    items: [
      {
        slug: "faces-of-resilience",
        title: items.resilience.title,
        date: "2022-03",
        image,
      },
      {
        slug: "a-wedding-tale",
        title: items.wedding.title,
        date: "2020-01",
        image,
      },
      {
        slug: "product-elegance",
        title: items.product.title,
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
