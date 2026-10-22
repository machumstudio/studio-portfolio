import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { FaqAccordion } from "./FaqAccordion";

const items = [
  [
    "What type of photography do you specialize in?",
    "We specialize in portrait, event, commercial and wedding photography.",
  ],
  [
    "How can I book a photography session with you?",
    "Leave your preferred date on the Contact page.",
  ],
  [
    "What equipment do you use for your photography?",
    "Two full-frame mirrorless bodies and prime lenses.",
  ],
  [
    "Can I request a specific location for a photoshoot?",
    "Yes. We scout it before the shoot.",
  ],
  [
    "What is your editing process like?",
    "We pick the best shots and balance color and exposure.",
  ],
  [
    "Are digital files included in your photography packages?",
    "Every package includes high-resolution files.",
  ],
  [
    "Do you offer prints of your photographs?",
    "Yes, prints are available for purchase.",
  ],
  [
    "How long does it take to receive the edited photos after a session?",
    "Usually within two weeks.",
  ],
].map(([question, answer], i) => ({ id: `q${i + 1}`, question, answer }));

const meta = {
  title: "UI/FaqAccordion",
  component: FaqAccordion,
  args: { items },
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="page-x py-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FaqAccordion>;

export default meta;
type Story = StoryObj<typeof meta>;

// 하나만 펼치기 (기본)
export const Single: Story = {
  args: { defaultOpen: ["q1"] },
  globals: { viewport: { value: "mobile", isRotated: false } },
};

// 시안 배치: lg 부터 2열, 1번과 7번을 함께 펼친 상태
export const TwoColumnsMultiple: Story = {
  args: { columns: 2, multiple: true, defaultOpen: ["q1", "q7"] },
  globals: { viewport: { value: "laptop", isRotated: false } },
};

export const Desktop: Story = {
  ...TwoColumnsMultiple,
  globals: { viewport: { value: "desktop", isRotated: false } },
};

// 키보드: 아래 화살표로 다음 헤더, Enter 로 펼치기
export const Keyboard: Story = {
  args: { columns: 2 },
  globals: { viewport: { value: "laptop", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole("button", { name: items[0].question });
    first.focus();
    await userEvent.keyboard("{ArrowDown}");
    const second = canvas.getByRole("button", { name: items[1].question });
    await expect(second).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(second).toHaveAttribute("aria-expanded", "true");
  },
};
