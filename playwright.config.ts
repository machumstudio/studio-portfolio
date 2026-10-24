import { defineConfig, devices } from "@playwright/test";

const port = 3100;

// 프로젝트 이름은 docs/design/reference/<page>-<name>.png 의 접미사와 같다
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 900 },
      },
    },
    {
      name: "laptop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm start -p ${port}`,
    // .env.local 에 Supabase 값이 있어도 인메모리로 띄운다. 문의 제출 e2e 가 클라우드 DB 에 쌓이지 않게
    // 사이트 주소는 이 서버 주소로 (canonical, sitemap 을 그대로 비교한다). VERCEL_ENV 가 없어 미리보기처럼 noindex 다
    env: {
      DATA_STORE: "memory",
      NEXT_PUBLIC_SITE_URL: `http://localhost:${port}`,
    },
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
