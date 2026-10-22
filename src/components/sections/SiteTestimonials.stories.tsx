import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import messages from "../../../messages/ko.json";
import { SiteTestimonials, type Testimonial } from "./SiteTestimonials";

const items: Testimonial[] = Object.entries(messages.Testimonials.items).map(
  ([id, item]) => ({
    id,
    ...item,
    rating: 5,
    socials: [
      { network: "instagram", href: "#" },
      { network: "facebook", href: "#" },
      { network: "x", href: "#" },
    ],
  }),
);

const meta = {
  title: "Sections/SiteTestimonials",
  component: SiteTestimonials,
  args: { total: 323, items },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SiteTestimonials>;

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
