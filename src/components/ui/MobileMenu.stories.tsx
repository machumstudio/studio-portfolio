import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { MobileMenu } from "./MobileMenu";

const meta = {
  title: "UI/MobileMenu",
  component: MobileMenu,
  args: {
    openLabel: "Open menu",
    closeLabel: "Close menu",
    children: (
      <nav aria-label="Main">
        <ul className="flex flex-col border-x border-dark-12 px-4">
          {["Home", "About Me", "Portfolio", "Services"].map((label) => (
            <li key={label} className="border-b border-dark-12">
              <a href="#" className="block py-5 text-h2 text-grey-70">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    ),
  },
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "mobile", isRotated: false } },
  decorators: [
    (Story) => (
      <div className="relative flex justify-end border-b border-dark-12 px-4 pt-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MobileMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

// 펼친 상태: 버튼을 눌러 연 뒤, 첫 링크에 포커스가 가 있는지 확인한다
export const Open: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open menu" }));
    await expect(canvas.getByRole("link", { name: "Home" })).toHaveFocus();
  },
};
