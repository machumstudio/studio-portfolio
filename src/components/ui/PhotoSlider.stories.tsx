import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PhotoSlider } from "./PhotoSlider";

const placeholder = { src: "/images/placeholder.svg", alt: "" };

const meta = {
  title: "UI/PhotoSlider",
  component: PhotoSlider,
  args: {
    images: [placeholder, placeholder, placeholder],
    label: "인물 촬영 사진",
    previousLabel: "이전 인물 촬영 사진",
    nextLabel: "다음 인물 촬영 사진",
    slideLabels: ["1 / 3", "2 / 3", "3 / 3"],
    sizes: "(min-width: 1024px) 56vw, 100vw",
    // Services 서비스 소개 사진 크기 (mobile 358x229 / 노트북 높이 311 / 데스크톱 360)
    photoClassName:
      "aspect-358/229 rounded-xl lg:aspect-auto lg:h-77.75 3xl:h-90 3xl:rounded-20",
  },
  decorators: [
    (Story) => (
      // 시안 사진 폭 718 / 894 + 좌우 여백
      <div className="page-x py-10 lg:w-219.5 3xl:w-304.5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PhotoSlider>;

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
