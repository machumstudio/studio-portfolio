import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { SectionHeading } from "./SectionHeading";

const meta = {
  title: "UI/SectionHeading",
  component: SectionHeading,
  args: { eyebrow: "About", title: "Meet Machum Studio" },
  decorators: [
    (Story) => (
      <div className="page-x py-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithButton: Story = {
  args: { actions: <Button variant="outline">Know More →</Button> },
};

// Portfolio: 화살표 묶음 + 버튼, 아래 정렬. 모바일 시안은 화살표를 카드 아래로 옮기므로 lg 부터 보인다
export const WithSliderControls: Story = {
  args: {
    eyebrow: "Portfolio",
    title: "Explore our photography work.",
    alignActions: "end",
    actions: (
      <>
        <div className="hidden gap-3 rounded-full border border-dark-12 bg-dark-03 p-1.75 lg:flex 3xl:gap-4 3xl:p-2.25">
          <Button variant="icon" size="lg" aria-label="Previous">
            <ChevronLeft />
          </Button>
          <Button variant="icon" size="lg" aria-label="Next">
            <ChevronRight />
          </Button>
        </div>
        <Button variant="outline">View All Works →</Button>
      </>
    ),
  },
};

export const TitleOnly: Story = {
  args: {
    eyebrow: "FAQ's",
    title: "Frequently asked questions",
    divider: false,
  },
};

export const Mobile: Story = {
  ...WithSliderControls,
  globals: { viewport: { value: "mobile", isRotated: false } },
};

export const Laptop: Story = {
  ...WithSliderControls,
  globals: { viewport: { value: "laptop", isRotated: false } },
};

export const Desktop: Story = {
  ...WithSliderControls,
  globals: { viewport: { value: "desktop", isRotated: false } },
};
