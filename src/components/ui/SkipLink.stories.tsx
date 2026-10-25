import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SkipLink } from "./SkipLink";

// 캔버스를 누른 뒤 Tab 을 누르면 왼쪽 위에 나타난다
const meta = {
  title: "UI/SkipLink",
  component: SkipLink,
  args: { children: "본문 바로가기" },
  render: (args) => (
    <div className="p-10">
      <SkipLink {...args} />
      <p className="text-body text-grey-70">Tab 을 눌러 보세요</p>
      <main id="main" className="mt-10 text-body text-white">
        본문
      </main>
    </div>
  ),
} satisfies Meta<typeof SkipLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Focused: Story = {
  play: async ({ canvasElement }) => {
    canvasElement.querySelector("a")?.focus();
  },
};
