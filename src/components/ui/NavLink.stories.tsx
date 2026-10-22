import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NavLink } from "./NavLink";

const meta = {
  title: "UI/NavLink",
  component: NavLink,
  args: { href: "/" },
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: "/portfolio" } },
  },
  render: () => (
    <nav className="flex gap-6 p-10">
      {[
        ["/", "Home"],
        ["/about", "About Me"],
        ["/portfolio", "Portfolio"],
        ["/services", "Services"],
      ].map(([href, label]) => (
        <NavLink
          key={href}
          href={href}
          className="text-button text-grey-70 aria-[current=page]:text-white aria-[current=page]:underline"
        >
          {label}
        </NavLink>
      ))}
    </nav>
  ),
} satisfies Meta<typeof NavLink>;

export default meta;
type Story = StoryObj<typeof meta>;

// 경로가 /portfolio 일 때: Portfolio 만 aria-current="page"
export const CurrentPortfolio: Story = {};

export const CurrentHome: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: "/" } },
  },
};
