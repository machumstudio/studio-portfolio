import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PortfolioCard } from "./PortfolioCard";

const meta = {
  title: "UI/PortfolioCard",
  component: PortfolioCard,
  args: {
    href: "/work/faces-of-resilience",
    title: "Faces of Resilience",
    date: "2022-03",
    dateLabel: "March 2022",
    image: { src: "/images/placeholder.svg", alt: "" },
    viewLabel: "View Project",
  },
  decorators: [
    (Story) => (
      <div className="w-89.5 p-4 lg:w-101.5 3xl:w-124.75">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PortfolioCard>;

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

// 제목이 길면 링크를 밀지 않고 줄바꿈한다
export const LongTitle: Story = {
  args: { title: "A Very Long Project Title That Wraps Onto Two Lines" },
};
