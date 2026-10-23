import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import messages from "../../../messages/ko.json";
import { HomeServices } from "./HomeServices";

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
