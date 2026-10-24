// 공유 카드 기본 이미지(1200x630, Open Graph / X)를 만든다: public/og/machum-studio-<locale>.jpg
// 사용: pnpm og:image (문구나 사진을 바꾸면 다시 돌리고 결과 이미지를 커밋한다)
//
// 카드는 미리 그린 그림 파일이다. 런타임 생성(next/og)은 한글 글꼴 파일을 함께 실어야 하고
// 받는 쪽(카카오톡, 슬랙, X)의 글꼴과도 상관없게 하려고 글자를 그림으로 굳힌다.
// 글꼴은 사이트와 같은 Pretendard(가변, 한글과 라틴 모두), 색은 docs/design/tokens.css 의 토큰 변수,
// 사진은 공개 작업 사진(public/images/works, 출처는 docs/design/photos.md)
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(import.meta.dirname, "..");
const file = (path: string) => pathToFileURL(join(root, path)).href;

const locales = ["ko", "en"] as const;
// 분야마다 한 장 (인물, 이벤트, 광고). 비공개 시드 작업(behind-the-scenes)의 사진은 쓰지 않는다
const photos = [
  "faces-of-resilience-1",
  "a-wedding-tale-1",
  "product-elegance-1",
].map((name) => file(`public/images/works/${name}.jpg`));

const escape = (text: string) =>
  text.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );

// docs/design/tokens.css 의 색 토큰을 브라우저가 읽는 :root 변수로 옮긴다 (@theme 블록은 Tailwind 문법이라)
async function colorTokens() {
  const css = await readFile(join(root, "docs/design/tokens.css"), "utf8");
  const vars = [...css.matchAll(/(--color-[\w-]+):\s*([^;]+);/g)].map(
    ([, name, value]) => `${name}: ${value};`,
  );
  return `:root { ${vars.join(" ")} }`;
}

async function messages(locale: string) {
  const json = JSON.parse(
    await readFile(join(root, `messages/${locale}.json`), "utf8"),
  );
  return {
    tagline: json.Hero.tagline as string,
    name: json.Hero.name as string,
    description: json.Metadata.description as string,
  };
}

const html = (
  text: Awaited<ReturnType<typeof messages>>,
  lang: string,
  tokens: string,
) => `
<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<style>
  ${tokens}
  @font-face {
    font-family: "Pretendard Variable";
    src: url("${file("node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2")}") format("woff2-variations");
    font-weight: 45 920;
  }
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    background: var(--color-dark-06); color: var(--color-white);
    font-family: "Pretendard Variable", sans-serif;
    display: grid; grid-template-columns: 1fr 470px; grid-template-rows: minmax(0, 1fr); gap: 40px; padding: 60px;
  }
  .text { display: flex; flex-direction: column; justify-content: space-between; }
  .bar { width: 72px; height: 8px; border-radius: 4px; background: var(--color-purple-55); }
  .tagline { margin-top: 36px; font-size: 36px; font-weight: 500; color: var(--color-purple-80); }
  .name { margin-top: 8px; font-size: 92px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.05; }
  .description { font-size: 28px; font-weight: 400; line-height: 1.5; color: var(--color-grey-70); word-break: keep-all; }
  .photos { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 14px; min-height: 0; }
  .photos img { width: 100%; height: 100%; min-height: 0; object-fit: cover; border-radius: 20px; background: var(--color-dark-15); }
  .photos img:first-child { grid-row: span 2; }
</style>
</head>
<body>
  <div class="text">
    <div>
      <div class="bar"></div>
      <p class="tagline">${escape(text.tagline)}</p>
      <p class="name">${escape(text.name)}</p>
    </div>
    <p class="description">${escape(text.description)}</p>
  </div>
  <div class="photos">${photos.map((src) => `<img src="${src}" alt="">`).join("")}</div>
</body>
</html>`;

const out = join(root, "public/og");
await mkdir(out, { recursive: true });
const work = await mkdtemp(join(tmpdir(), "og-image-"));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
  });
  const tokens = await colorTokens();
  for (const locale of locales) {
    const pageFile = join(work, `${locale}.html`);
    await writeFile(pageFile, html(await messages(locale), locale, tokens));
    await page.goto(pathToFileURL(pageFile).href);
    await page.evaluate(() => document.fonts.ready);
    const path = join(out, `machum-studio-${locale}.jpg`);
    await page.screenshot({ path, type: "jpeg", quality: 85 });
    console.info(`[og:image] ${path}`);
  }
} finally {
  await browser.close();
  await rm(work, { recursive: true, force: true });
}
