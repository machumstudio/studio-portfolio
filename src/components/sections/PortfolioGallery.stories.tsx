import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PortfolioGallery } from "./PortfolioGallery";

const image = { src: "/images/placeholder.svg", alt: "" };
const items = (titles: [string, string, string][]) =>
  titles.map(([slug, title, date]) => ({ slug, title, date, image }));

const meta = {
  title: "Sections/PortfolioGallery",
  component: PortfolioGallery,
  args: {
    galleries: [
      {
        category: "portrait",
        items: items([
          ["faces-of-resilience", "Faces of Resilience", "2022-03"],
          ["innocence-unveiled", "Innocence Unveiled", "2020-01"],
          ["elegance-in-monochrome", "Elegance in Monochrome", "2020-01"],
        ]),
      },
      {
        category: "events",
        items: items([
          ["a-wedding-tale", "A Wedding Tale", "2021-09"],
          [
            "corporate-excellence-summit",
            "Corporate Excellence Summit",
            "2019-11",
          ],
          ["festival-of-colors", "Festival of Colors", "2018-03"],
          ["behind-the-scenes", "Behind the Scenes", "2017-06"],
        ]),
      },
    ],
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PortfolioGallery>;

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
// 공개 작업이 없는 카테고리 (필터로 골랐을 때)
export const Empty: Story = {
  args: { galleries: [{ category: "commercial", items: [] }] },
};
