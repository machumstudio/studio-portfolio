import type { Preview } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import { manrope } from "../src/lib/fonts";
import messages from "../messages/ko.json";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="ko" messages={messages}>
        <div className={`${manrope.variable} bg-dark-03 font-sans text-white`}>
          <Story />
        </div>
      </NextIntlClientProvider>
    ),
  ],
};

export default preview;
