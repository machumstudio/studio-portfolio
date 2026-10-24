import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PortfolioCard } from "./PortfolioCard";
import { tallPhoto, tinyPhoto, widePhoto } from "./photo-fixtures";

const meta = {
  title: "UI/PortfolioCard",
  component: PortfolioCard,
  args: {
    href: "/work/faces-of-resilience",
    title: "Faces of Resilience",
    date: "2022-03",
    dateLabel: "March 2022",
    image: { src: "/images/works/faces-of-resilience-1.jpg", alt: "" },
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

// Portfolio 페이지 갤러리 크기 (노트북 사진 409, 제목 16)
export const GalleryLaptop: Story = {
  args: { variant: "gallery" },
  globals: { viewport: { value: "laptop", isRotated: false } },
};

// 관리자 업로드처럼 비율/크기가 제각각인 사진(1:4, 4:1, 200px). 사진 칸 크기와 주변 배치는 그대로, 사진만 잘린다
export const TallPhoto: Story = {
  args: { image: tallPhoto },
  globals: { viewport: { value: "laptop", isRotated: false } },
};
export const WidePhoto: Story = {
  args: { image: widePhoto },
  globals: { viewport: { value: "mobile", isRotated: false } },
};
export const TinyPhoto: Story = {
  args: { image: tinyPhoto },
  globals: { viewport: { value: "desktop", isRotated: false } },
};
