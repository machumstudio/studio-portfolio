import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { SiteHeader } from "./SiteHeader";

const meta = {
  title: "Sections/SiteHeader",
  component: SiteHeader,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true, navigation: { pathname: "/" } },
  },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};

// 모바일 메뉴 펼친 상태 (현재 페이지: Portfolio)
export const MobileMenuOpen: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: "/portfolio" } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "메뉴 열기" }));
    // 390 에서는 데스크톱 메뉴가 display:none 이라 보이는 메뉴는 펼친 모바일 메뉴 하나다
    const mobileNav = canvas.getByRole("navigation", { name: "주요 메뉴" });
    await expect(
      within(mobileNav).getByRole("link", { name: "포트폴리오" }),
    ).toHaveAttribute("aria-current", "page");
  },
};

export const Laptop: Story = {
  globals: { viewport: { value: "laptop", isRotated: false } },
};

export const Desktop: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
};

export const DesktopCurrentServices: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: "/services" } },
  },
};
