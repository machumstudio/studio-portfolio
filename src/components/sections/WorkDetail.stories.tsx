import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WorkDetail } from "./WorkDetail";
import { oddPhotos, tallPhoto } from "@/components/ui/photo-fixtures";

const photo = { src: "/images/placeholder.svg", alt: "" };

const meta = {
  title: "Sections/WorkDetail",
  component: WorkDetail,
  args: {
    title: "A Wedding Tale",
    category: "events",
    date: "2021-09",
    cover: photo,
    images: [photo, photo, photo, photo],
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof WorkDetail>;

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
  args: { cover: tallPhoto, images: oddPhotos(4) },
  globals: { viewport: { value: "laptop", isRotated: false } },
};
