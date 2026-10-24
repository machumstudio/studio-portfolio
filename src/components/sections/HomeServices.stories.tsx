import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import messages from "../../../messages/ko.json";
import { HomeServices } from "./HomeServices";
import { oddPhotos } from "@/components/ui/photo-fixtures";

const { items } = messages.Services;

const meta = {
  title: "Sections/HomeServices",
  component: HomeServices,
  args: {
    items: (["events", "portrait", "commercial"] as const).map((id) => ({
      id,
      name: items[id].name,
      body: items[id].body,
      highlights: Object.values(items[id].highlights),
      image: { src: "/images/placeholder.svg", alt: "" },
    })),
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HomeServices>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};

// 다음 화살표로 두 번째 서비스로 넘어가면 이전 화살표가 켜진다
export const Laptop: Story = {
  globals: { viewport: { value: "laptop", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const previous = canvas.getByRole("button", { name: "이전 서비스" });
    await expect(previous).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(canvas.getByRole("button", { name: "다음 서비스" }));
    await waitFor(() =>
      expect(previous).toHaveAttribute("aria-disabled", "false"),
    );
  },
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
  globals: { viewport: { value: "mobile", isRotated: false } },
};
