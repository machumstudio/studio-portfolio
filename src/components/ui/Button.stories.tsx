import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonStyles } from "./Button";

const meta = {
  title: "UI/Button",
  component: Button,
  args: { children: "Know More →" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "outline", "link", "icon"],
    },
    size: { control: "inline-radio", options: ["md", "lg"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { "aria-label": "Let's work together", children: <ArrowUpRight /> },
};

export const PrimaryWithText: Story = {
  args: {
    children: (
      <>
        Book a Session
        <ArrowUpRight />
      </>
    ),
  },
};

export const Outline: Story = { args: { variant: "outline" } };

export const IconMedium: Story = {
  args: {
    variant: "icon",
    size: "md",
    "aria-label": "Next",
    children: <ChevronRight />,
  },
};

export const IconLarge: Story = {
  args: {
    variant: "icon",
    size: "lg",
    "aria-label": "Next",
    children: <ChevronRight />,
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    children: (
      <>
        Book a Call
        <ArrowUpRight strokeWidth={1.5} />
      </>
    ),
  },
};

export const Disabled: Story = { args: { variant: "outline", disabled: true } };

export const AsLink: Story = {
  render: () => (
    <a href="#contact" className={buttonStyles({ variant: "outline" })}>
      Contact Me
    </a>
  ),
};

// 변형 전부를 한 화면에. 뷰포트별 스토리가 이걸 다시 쓴다
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 page-x py-10">
      <div className="flex flex-wrap items-center gap-4">
        <Button aria-label="Let's work together">
          <ArrowUpRight />
        </Button>
        <Button>
          Book a Session
          <ArrowUpRight />
        </Button>
        <Button variant="outline">View All Works →</Button>
        <Button variant="outline" disabled>
          Disabled
        </Button>
        <Button variant="link">
          View Projects
          <ArrowUpRight strokeWidth={1.5} />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="icon" size="md" aria-label="Previous">
          <ChevronLeft />
        </Button>
        <Button variant="icon" size="md" aria-label="Next">
          <ChevronRight />
        </Button>
        <Button variant="icon" size="lg" aria-label="Previous">
          <ChevronLeft />
        </Button>
        <Button variant="icon" size="lg" aria-label="Next">
          <ChevronRight />
        </Button>
      </div>
    </div>
  ),
};

export const Mobile: Story = {
  ...AllVariants,
  globals: { viewport: { value: "mobile", isRotated: false } },
};

export const Laptop: Story = {
  ...AllVariants,
  globals: { viewport: { value: "laptop", isRotated: false } },
};

export const Desktop: Story = {
  ...AllVariants,
  globals: { viewport: { value: "desktop", isRotated: false } },
};
