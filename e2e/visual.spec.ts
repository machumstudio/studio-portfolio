import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { test } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

// 시안 원본(docs/design/reference)과 전체 페이지 스크린샷을 픽셀 비교해 차이율을 남긴다.
// reference 는 .gitignore 대상이라 없는 환경에서는 건너뛴다.
// 사진 영역은 data-visual-mask 를 붙이면 양쪽 모두 같은 색으로 덮고 비교한다.
const pages = [{ name: "home", path: "/" }];

type Rect = { x: number; y: number; width: number; height: number };

function fillRects(png: PNG, rects: Rect[]) {
  for (const r of rects) {
    for (
      let y = Math.max(0, Math.floor(r.y));
      y < Math.min(png.height, r.y + r.height);
      y++
    ) {
      for (
        let x = Math.max(0, Math.floor(r.x));
        x < Math.min(png.width, r.x + r.width);
        x++
      ) {
        png.data.fill(0, (y * png.width + x) * 4, (y * png.width + x) * 4 + 3);
      }
    }
  }
}

for (const { name, path } of pages) {
  test(`${name} 시각 비교 @visual`, async ({ page }, testInfo) => {
    const refPath = `docs/design/reference/${name}-${testInfo.project.name}.png`;
    test.skip(!existsSync(refPath), `${refPath} 없음`);

    // 시안은 정지 화면이라 마키 같은 애니메이션을 처음 위치에 세운다
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const rects = await page.locator("[data-visual-mask]").evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          x: r.x + scrollX,
          y: r.y + scrollY,
          width: r.width,
          height: r.height,
        };
      }),
    );

    const actual = PNG.sync.read(await page.screenshot({ fullPage: true }));
    const expected = PNG.sync.read(readFileSync(refPath));
    fillRects(actual, rects);
    fillRects(expected, rects);

    // 겹치는 영역은 픽셀 비교, 높이/너비가 다른 부분은 전부 차이로 센다
    const width = Math.min(actual.width, expected.width);
    const height = Math.min(actual.height, expected.height);
    const crop = (src: PNG) => {
      const out = new PNG({ width, height });
      PNG.bitblt(src, out, 0, 0, width, height, 0, 0);
      return out;
    };
    const diff = new PNG({ width, height });
    const diffPixels = pixelmatch(
      crop(actual).data,
      crop(expected).data,
      diff.data,
      width,
      height,
      {
        threshold: 0.1,
      },
    );
    const total =
      Math.max(actual.width, expected.width) *
      Math.max(actual.height, expected.height);
    const ratio = (diffPixels + (total - width * height)) / total;

    const outDir = testInfo.outputPath();
    mkdirSync(outDir, { recursive: true });
    writeFileSync(`${outDir}/diff.png`, PNG.sync.write(diff));
    writeFileSync(`${outDir}/actual.png`, PNG.sync.write(actual));

    const summary = `${name}-${testInfo.project.name}: ${(ratio * 100).toFixed(2)}% (${actual.width}x${actual.height} vs ${expected.width}x${expected.height})`;
    testInfo.annotations.push({ type: "diff", description: summary });
    console.log(`[visual] ${summary}`);
    // 합격 기준(차이율 상한)은 섹션 구현이 시작되면 정한다. 지금은 측정만 한다.
  });
}
