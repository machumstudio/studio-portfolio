import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { test } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

// 시안 원본(docs/design/reference)과 전체 페이지 스크린샷을 픽셀 비교해 차이율을 남긴다.
// reference 는 .gitignore 대상이라 없는 환경에서는 건너뛴다.
// 사진 영역은 data-visual-mask 를 붙이면 양쪽 모두 같은 색으로 덮고 비교한다.
const pages = [
  { name: "home", path: "/" },
  { name: "portfolio", path: "/portfolio" },
  { name: "about", path: "/about" },
];

// 섹션별 차이율: 구현 페이지의 섹션 상자와 시안의 같은 섹션 띠(y, h)를 잘라 비교한다.
// 시안 y 는 노드 JSON 의 섹션 h 합 + 섹션 간격(80/150/200), 헤더와 히어로 사이는 간격 없음.
// portfolio: 헤더-히어로 40/80/100, 히어로-브랜드 띠(구현은 카테고리 필터) 40/60/80, 띠-갤러리 80/100/150,
// 이후 80/150/200. 히어로 띠는 사진+글 부분만 (브랜드 띠 자리는 필터라 시안과 다르다).
// about: 헤더-소개 40/80/100, 소개-이야기 60/80/100, 이후 80/150/200.
type Band = readonly [y: number, h: number];
const sections: Record<
  string,
  { selector: string; ref: Record<string, Record<string, Band>> }
> = {
  hero: {
    selector: 'section[aria-labelledby="hero-title"]',
    ref: {
      home: { mobile: [108, 553], laptop: [89, 742], desktop: [119, 920] },
    },
  },
  portfolioHero: {
    selector: 'section[aria-labelledby="portfolio-hero-title"]',
    ref: {
      portfolio: {
        mobile: [148, 449],
        laptop: [169, 716],
        desktop: [219, 784],
      },
    },
  },
  aboutHero: {
    selector: 'section[aria-labelledby="about-hero-title"]',
    ref: {
      about: { mobile: [148, 664], laptop: [169, 784], desktop: [219, 784] },
    },
  },
  biography: {
    selector: 'section[aria-labelledby="about-biography-title"]',
    ref: {
      about: { mobile: [872, 490], laptop: [1033, 340], desktop: [1103, 440] },
    },
  },
  timeline: {
    selector: 'section[aria-labelledby="about-timeline-title"]',
    ref: {
      about: {
        mobile: [1442, 1263],
        laptop: [1523, 818],
        desktop: [1743, 1029],
      },
    },
  },
  gallery: {
    selector: "#works",
    ref: {
      portfolio: {
        mobile: [812, 2009],
        laptop: [1166, 2071],
        desktop: [1383, 2658],
      },
    },
  },
  about: {
    selector: 'section[aria-labelledby="about-title"]',
    ref: {
      home: { mobile: [741, 1268], laptop: [981, 775], desktop: [1239, 950] },
    },
  },
  services: {
    selector: 'section[aria-labelledby="services-title"]',
    ref: {
      home: { mobile: [2089, 1231], laptop: [1906, 752], desktop: [2389, 865] },
    },
  },
  portfolio: {
    selector: 'section[aria-labelledby="portfolio-title"]',
    ref: {
      home: { mobile: [3400, 738], laptop: [2808, 686], desktop: [3454, 834] },
    },
  },
  faq: {
    selector: 'section[aria-labelledby="faq-title"]',
    ref: {
      home: { mobile: [4218, 632], laptop: [3644, 663], desktop: [4488, 791] },
      portfolio: {
        mobile: [2901, 632],
        laptop: [3387, 663],
        desktop: [4241, 791],
      },
    },
  },
  testimonials: {
    selector: "#testimonials",
    ref: {
      home: { mobile: [4930, 591], laptop: [4457, 529], desktop: [5479, 657] },
      portfolio: {
        mobile: [3613, 591],
        laptop: [4200, 529],
        desktop: [5232, 657],
      },
      about: {
        mobile: [2785, 591],
        laptop: [2491, 529],
        desktop: [2972, 657],
      },
    },
  },
};

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

// 가로 전체, 세로 [y, y + h) 띠를 잘라 낸다
function crop(src: PNG, y: number, h: number) {
  const height = Math.min(h, src.height - y);
  const out = new PNG({ width: src.width, height });
  PNG.bitblt(src, out, 0, y, src.width, height, 0, 0);
  return out;
}

// 겹치는 영역은 픽셀 비교, 높이/너비가 다른 부분은 전부 차이로 센다
function compare(actual: PNG, expected: PNG) {
  const width = Math.min(actual.width, expected.width);
  const height = Math.min(actual.height, expected.height);
  const fit = (src: PNG) => {
    const out = new PNG({ width, height });
    PNG.bitblt(src, out, 0, 0, width, height, 0, 0);
    return out;
  };
  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(
    fit(actual).data,
    fit(expected).data,
    diff.data,
    width,
    height,
    { threshold: 0.1 },
  );
  const total =
    Math.max(actual.width, expected.width) *
    Math.max(actual.height, expected.height);
  return { ratio: (diffPixels + (total - width * height)) / total, diff };
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

    const outDir = testInfo.outputPath();
    mkdirSync(outDir, { recursive: true });
    const report = (label: string, a: PNG, b: PNG) => {
      const { ratio, diff } = compare(a, b);
      writeFileSync(`${outDir}/${label}-diff.png`, PNG.sync.write(diff));
      const summary = `${label}-${testInfo.project.name}: ${(ratio * 100).toFixed(2)}% (${a.width}x${a.height} vs ${b.width}x${b.height})`;
      testInfo.annotations.push({ type: "diff", description: summary });
      console.log(`[visual] ${summary}`);
    };
    writeFileSync(`${outDir}/actual.png`, PNG.sync.write(actual));
    report(name, actual, expected);

    for (const [section, { selector, ref }] of Object.entries(sections)) {
      // 이 페이지에 없는 섹션은 건너뛴다 (boundingBox 는 요소가 생길 때까지 기다린다)
      const band = ref[name]?.[testInfo.project.name];
      if (!band) continue;
      const box = await page.locator(selector).boundingBox();
      if (!box) continue;
      const y = Math.round(box.y + (await page.evaluate(() => scrollY)));
      report(
        `${name}-${section}`,
        crop(actual, y, Math.round(box.height)),
        crop(expected, band[0], band[1]),
      );
    }
    // 합격 기준(차이율 상한)은 섹션 구현이 시작되면 정한다. 지금은 측정만 한다.
  });
}
