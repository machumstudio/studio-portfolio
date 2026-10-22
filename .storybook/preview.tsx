import type { Preview } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import { manrope } from "../src/lib/fonts";
import messages from "../messages/ko.json";
import "../src/app/globals.css";

// Tailwind 는 --font-sans 를 :root 에서 var(--font-manrope) 로 계산하므로,
// 폰트 변수 클래스도 앱(layout.tsx 의 <html>)처럼 루트에 붙여야 한다
document.documentElement.classList.add(manrope.variable);

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // 시안 프레임 크기. 스토리에서 globals: { viewport: { value: "mobile" } } 로 고른다
    viewport: {
      options: {
        mobile: {
          name: "Mobile 390",
          styles: { width: "390px", height: "844px" },
          type: "mobile",
        },
        laptop: {
          name: "Laptop 1440",
          styles: { width: "1440px", height: "900px" },
          type: "desktop",
        },
        desktop: {
          name: "Desktop 1920",
          styles: { width: "1920px", height: "1080px" },
          type: "desktop",
        },
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
        <div className="bg-dark-03 font-sans text-white">
          <Story />
        </div>
      </NextIntlClientProvider>
    ),
  ],
};

export default preview;
