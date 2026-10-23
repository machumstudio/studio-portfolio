import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AboutHero } from "./AboutHero";

const meta = {
  title: "Sections/AboutHero",
  component: AboutHero,
  args: {
    image: { src: "/images/placeholder.svg", alt: "" },
    stats: [
      { id: "years", value: "15+", label: "Years in Business" },
      { id: "clients", value: "500+", label: "Happy Clients" },
      { id: "awards", value: "10+", label: "Photography Awards" },
      { id: "abroad", value: "05+", label: "International Shoots" },
      { id: "followers", value: "10,000+", label: "Social Media Followers" },
      { id: "retention", value: "90%", label: "Client Retention Rate" },
    ],
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AboutHero>;

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
