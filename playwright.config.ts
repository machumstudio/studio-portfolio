import { defineConfig, devices } from "@playwright/test";

const port = 3100;

// 프로젝트 이름은 docs/design/reference/<page>-<name>.png 의 접미사와 같다.
//
// 어느 화면 크기에서 도나 (새 테스트를 쓸 때 이 기준으로 정한다)
// - 기본: laptop(1440) 한 곳에서만. 화면 크기와 상관없는 것: 응답(sitemap, robots, 301, 메타 태그, 상태 코드),
//   관리자 흐름, 문의 처리, 폼 검증, 키보드 조작, 404, 납품 확인 흐름(@delivery)
// - 태그 @responsive: mobile(390) / laptop / desktop(1920) 세 곳에서. 화면 크기에 따라 결과가 달라지는 것:
//   레이아웃과 넘침, 헤더 메뉴/햄버거, 슬라이더의 한 화면 장 수, CLS, 시각 비교(@visual), axe 접근성,
//   사진 칸 비율, 프로젝트 이름(mobile/desktop)으로 분기하는 테스트
//   test("…", { tag: "@responsive" }, async (…) => …) 또는 test.describe("…", { tag: "@responsive" }, …)
// - 뷰포트를 직접 바꾸는 테스트(setViewportSize 로 320/640/768/1024… 를 도는 것)는 태그 없이 laptop 에서 한 번
const responsiveOnly = /@responsive/;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // CI: GitHub 러너(4코어)에서 3개. 서버(webServer 하나, 빌드 한 번)와 사진 최적화가 같은 코어를 쓰므로 한 코어는 남긴다.
  // 4개는 빨라지지 않고(4.8분) 페이지를 여러 개 도는 테스트가 30초를 넘겼다 (22칸). 로컬은 기본값(코어 절반)
  workers: process.env.CI ? 3 : undefined,
  // CI: 실패한 테스트의 스크린샷, trace, HTML 보고서를 아티팩트로 올린다 (.github/workflows/ci.yml e2e)
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile",
      grep: responsiveOnly,
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
      grep: responsiveOnly,
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
