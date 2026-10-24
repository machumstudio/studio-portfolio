// Lighthouse 측정: 공개 페이지 6개 × 모바일/데스크톱, 페이지마다 여러 번 재고 중앙값을 낸다.
// 결과는 마크다운 표로 출력한다 (docs/performance.md 에 옮겨 적는다). 페이지마다 첫 회(서버 캐시 데우기)는 버린다.
//
// 사용 (운영과 같은 빌드를 띄운 뒤):
//   VERCEL_ENV=production pnpm build && VERCEL_ENV=production pnpm start
//   pnpm lighthouse                      # http://localhost:3000, 3회
//   pnpm lighthouse --base http://localhost:3200 --runs 5 --json scratch/lh.json
// VERCEL_ENV=production 이 없으면 미리보기처럼 noindex 가 붙어 SEO 점수가 떨어진다 (src/lib/seo/site.ts).
// 브라우저는 Playwright 의 Chromium 을 쓴다 (pnpm exec playwright install chromium)
import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { chromium } from "@playwright/test";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";

const { values } = parseArgs({
  options: {
    base: { type: "string", default: "http://localhost:3000" },
    runs: { type: "string", default: "3" },
    json: { type: "string" },
  },
});
const runs = Number(values.runs);

const pages = [
  ["홈", "/"],
  ["포트폴리오", "/portfolio"],
  ["작업 상세", "/work/a-wedding-tale"],
  ["소개", "/about"],
  ["서비스", "/services"],
  ["문의", "/contact"],
];
// 모바일은 Lighthouse 기본(Moto G Power 크기, 느린 4G·CPU 4배 감속 시뮬레이션), 데스크톱은 desktop 설정
const formFactors = [
  ["모바일", undefined],
  ["데스크톱", desktopConfig],
];
const categories = ["performance", "accessibility", "best-practices", "seo"];

const lcpLabel = (node) => {
  if (!node) return "";
  const photo = /url=([^&"]+)/.exec(node.snippet ?? "");
  return photo
    ? `사진 ${decodeURIComponent(photo[1])}`
    : `${node.nodeLabel} (${node.selector})`;
};

const median = (list) => {
  const sorted = [...list].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

const chrome = await chromeLauncher.launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ["--headless=new", "--no-first-run"],
});

const results = [];
let environment;
try {
  for (const [formName, config] of formFactors) {
    for (const [pageName, path] of pages) {
      const url = new URL(path, values.base).href;
      const samples = [];
      // 첫 회는 버린다: 서버가 사진 크기별 최적화(/_next/image)를 처음 만드는 회차라 느리다.
      // 운영(Vercel)은 최적화한 사진을 캐시해 두므로 두 번째 방문부터가 실제 방문자에 가깝다
      for (let i = -1; i < runs; i++) {
        const { lhr } = await lighthouse(
          url,
          { port: chrome.port, output: "json", logLevel: "error" },
          config,
        );
        if (i >= 0) samples.push(lhr);
        environment ??= {
          lighthouse: lhr.lighthouseVersion,
          chrome: lhr.environment.hostUserAgent.match(/Chrome\/([\d.]+)/)?.[1],
          benchmarkIndex: lhr.environment.benchmarkIndex,
        };
      }
      // 성능은 매번 흔들려서 중앙값. 나머지 점수와 지표도 그 회차가 아니라 항목별 중앙값
      const score = (lhr, id) => Math.round(lhr.categories[id].score * 100);
      const metric = (lhr, id) => lhr.audits[id].numericValue;
      const failed = (lhr) =>
        Object.values(lhr.categories)
          .filter((category) => category.id !== "performance")
          .flatMap((category) =>
            category.auditRefs
              .filter((ref) => ref.weight > 0)
              .map((ref) => lhr.audits[ref.id])
              .filter((audit) => audit.score !== null && audit.score < 1)
              .map((audit) => audit.id),
          );
      results.push({
        form: formName,
        page: pageName,
        path,
        scores: Object.fromEntries(
          categories.map((id) => [
            id,
            median(samples.map((l) => score(l, id))),
          ]),
        ),
        lcp: median(samples.map((l) => metric(l, "largest-contentful-paint"))),
        cls: median(samples.map((l) => metric(l, "cumulative-layout-shift"))),
        tbt: median(samples.map((l) => metric(l, "total-blocking-time"))),
        fcp: median(samples.map((l) => metric(l, "first-contentful-paint"))),
        // Lighthouse 13 은 LCP 요소를 lcp-breakdown-insight 의 node 항목으로 준다. 사진이면 원본 경로만
        lcpElement: lcpLabel(
          samples[0].audits["lcp-breakdown-insight"]?.details?.items?.find(
            (item) => item.type === "node",
          ),
        ),
        failed: [...new Set(samples.flatMap(failed))],
      });
      console.error(`[lighthouse] ${formName} ${path} 완료`);
    }
  }
} finally {
  chrome.kill();
}

console.log(
  `측정: ${new Date().toISOString().slice(0, 10)}, Lighthouse ${environment.lighthouse}, Chrome ${environment.chrome}, ` +
    `CPU benchmarkIndex ${Math.round(environment.benchmarkIndex)}, 페이지마다 ${runs}회 중앙값 (첫 회 버림), ${values.base}\n`,
);
const seconds = (ms) => `${(ms / 1000).toFixed(1)}s`;
const lines = [
  `| 화면 | 페이지 | 성능 | 접근성 | 권장사항 | SEO | LCP | CLS | TBT | FCP |`,
  `|---|---|---|---|---|---|---|---|---|---|`,
  ...results.map(
    (r) =>
      `| ${r.form} | ${r.page} \`${r.path}\` | ${categories.map((id) => r.scores[id]).join(" | ")} | ${seconds(r.lcp)} | ${r.cls.toFixed(3)} | ${Math.round(r.tbt)}ms | ${seconds(r.fcp)} |`,
  ),
];
console.log(lines.join("\n"));
const notes = results.filter((r) => r.failed.length > 0);
if (notes.length) {
  console.log("\n성능 외 감점 항목:");
  for (const r of notes)
    console.log(`- ${r.form} ${r.path}: ${r.failed.join(", ")}`);
}
console.log("\nLCP 요소:");
for (const r of results) console.log(`- ${r.form} ${r.path}: ${r.lcpElement}`);
if (values.json)
  await writeFile(
    values.json,
    JSON.stringify({ environment, runs, results }, null, 2) + "\n",
  );
