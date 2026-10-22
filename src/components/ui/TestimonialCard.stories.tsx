import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { siFacebook, siInstagram, siX } from "simple-icons";
import { TestimonialCard } from "./TestimonialCard";

const meta = {
  title: "UI/TestimonialCard",
  component: TestimonialCard,
  args: {
    name: "Emily Johnson",
    location: "USA, California",
    rating: 5,
    ratingLabel: "5 out of 5 stars",
    quote:
      "Machum Studio's photography doesn't just capture moments; it captures emotions. Their work is simply mesmerizing.",
    socials: [siInstagram, siFacebook, siX].map((icon) => ({
      label: `Emily Johnson on ${icon.title} (opens in a new tab)`,
      href: "#",
      iconPath: icon.path,
    })),
  },
  decorators: [
    (Story) => (
      <div className="w-89.5 lg:w-102 3xl:w-128">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TestimonialCard>;

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
export const FourStars: Story = {
  args: { rating: 4, ratingLabel: "4 out of 5 stars" },
};
