import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SubmitButton } from "./SubmitButton";

// 누르면 2초 동안 "보내는 중" 상태를 보여 준다
const slowAction = () => new Promise<void>((done) => setTimeout(done, 2000));

const meta = {
  title: "UI/SubmitButton",
  component: SubmitButton,
  args: { children: "확인으로 표시", pendingLabel: "바꾸는 중…" },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "outline"] },
  },
  decorators: [
    (Story) => (
      <form action={slowAction}>
        <Story />
      </form>
    ),
  ],
} satisfies Meta<typeof SubmitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Outline: Story = { args: { variant: "outline" } };
