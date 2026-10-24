import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HomeHero, heroPhotoCount } from "./HomeHero";
import { oddPhotos } from "@/components/ui/photo-fixtures";

const meta = {
  title: "Sections/HomeHero",
  component: HomeHero,
  args: {
    photos: Array.from({ length: heroPhotoCount }, () => ({
      src: "/images/works/festival-of-colors-2.jpg",
      alt: "",
    })),
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HomeHero>;

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
  args: { photos: oddPhotos(heroPhotoCount) },
  globals: { viewport: { value: "laptop", isRotated: false } },
};
