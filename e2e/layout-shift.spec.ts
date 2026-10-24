import { expect, test } from "@playwright/test";

// 레이아웃 이동(CLS). 띠배너(카테고리 마키)는 계속 움직이고, 슬라이더(서비스, 후기)와 사진은
// 늦게 그려져도 자리를 미리 잡고 있어야 한다. 페이지를 열고 아래까지 내려 사진/슬라이더가 다 그려진 뒤
// 사용자 입력 없이 생긴 layout-shift 를 모두 더한다 (Lighthouse 와 같은 "입력 직후 제외" 기준).
// Lighthouse 측정(docs/performance.md)은 모든 페이지 0.000 이다. 좋음 기준은 0.1
const pages = [
  "/",
  "/portfolio",
  "/work/a-wedding-tale",
  "/about",
  "/services",
  "/contact",
];

for (const path of pages) {
  test(`${path}: 사진, 띠배너, 슬라이더가 레이아웃을 밀지 않는다 (CLS < 0.01)`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const shifts: number[] = [];
      (window as unknown as { __shifts: number[] }).__shifts = shifts;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        })[])
          if (!entry.hadRecentInput) shifts.push(entry.value);
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(path, { waitUntil: "load" });
    // 지연 로드 사진이 들어오도록 끝까지 내렸다가 올라온다 (스크롤은 입력이 아니라 이동에 잡힌다)
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      window.scrollTo(0, 0);
    });
    // 띠배너가 몇 바퀴 도는 동안
    await page.waitForTimeout(1500);
    const cls = await page.evaluate(() =>
      (window as unknown as { __shifts: number[] }).__shifts.reduce(
        (sum, value) => sum + value,
        0,
      ),
    );
    expect(cls).toBeLessThan(0.01);
  });
}
