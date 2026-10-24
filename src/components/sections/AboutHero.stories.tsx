import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AboutHero } from "./AboutHero";
import {
  tallPhoto,
  tinyPhoto,
  widePhoto,
} from "@/components/ui/photo-fixtures";

const meta = {
  title: "Sections/AboutHero",
  component: AboutHero,
  args: {
    image: { src: "/images/pages/about-hero.jpg", alt: "" },
    stats: [
      { id: "years", value: "15+", label: "Years in Business" },
      { id: "clients", value: "500+", label: "Happy Clients" },
      { id: "awards", value: "10+", label: "Photography Awards" },
      { id: "abroad", value: "05+", label: "International Shoots" },
      { id: "followers", value: "10,000+", label: "Social Media Followers" },
      { id: "retention", value: "90%", label: "Client Retention Rate" },
    ],
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AboutHero>;

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
