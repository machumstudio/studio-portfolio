import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TokenSheet } from "./token-sheet";

const meta = {
  title: "Tokens/TokenSheet",
  component: TokenSheet,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TokenSheet>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
