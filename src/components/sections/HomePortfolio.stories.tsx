import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HomePortfolio } from "./HomePortfolio";
import { oddPhotos } from "@/components/ui/photo-fixtures";

const image = { src: "/images/works/faces-of-resilience-1.jpg", alt: "" };

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

// 관리자 업로드처럼 비율/크기가 제각각인 사진(1:4, 4:1, 200px). 사진 칸 크기와 주변 배치는 그대로, 사진만 잘린다
export const OddPhotos: Story = {
  args: {
    items: meta.args.items.map((item, i) => ({
      ...item,
      image: oddPhotos(3)[i]!,
    })),
  },
  globals: { viewport: { value: "laptop", isRotated: false } },
};
