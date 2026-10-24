import { expect, test, type Page } from "@playwright/test";

// 시안은 390 / 1440 / 1920 뿐이라 그 사이 폭(태블릿 768, 노트북 1024~1439)에서 깨지기 쉽다.
// ko/en 모든 화면을 768 / 1024 / 1180 / 1280 에서 열어 본다:
// 가로 넘침, 글자 넘침, 헤더 메뉴가 로고/문의 버튼과 겹침, 푸터 워드마크 잘림, 메뉴/푸터 링크가 단어 중간에서 꺾임
const widths = [768, 1024, 1180, 1280];
const paths = [
  "/",
  "/about",
  "/portfolio",
  "/services",
  "/contact",
  "/work/a-wedding-tale",
  "/nope",
];
const locales = ["", "/en"];

const problems = (page: Page) =>
  page.evaluate(() => {
    const found: string[] = [];
    const over = document.documentElement.scrollWidth - innerWidth;
    if (over > 0) found.push(`가로 넘침 ${over}px`);

    // 글자가 자기 상자를 넘침 (sr-only 1px 상자는 일부러 넘치게 둔 것이라 뺀다)
    for (const el of document.querySelectorAll<HTMLElement>(
      "main :is(h1, h2, h3, a, button, label, dt, dd), header :is(a, button), footer :is(a, h2, h3)",
    ))
      if (
        el.clientWidth > 1 &&
        el.checkVisibility() &&
        el.scrollWidth > el.clientWidth + 1
      )
        found.push(`글자 넘침 "${el.innerText.trim().slice(0, 30)}"`);

    // 헤더: 로고 | 메뉴 | 문의 버튼이 겹치지 않는다
    const header = document.querySelector("header");
    const nav = header?.querySelector("nav");
    if (nav?.checkVisibility()) {
      const brand = header!.querySelector("a")!.getBoundingClientRect();
      const menu = nav.getBoundingClientRect();
      const contact = [...header!.querySelectorAll("a")]
        .find((a) => a.getAttribute("href")?.endsWith("/contact"))!
        .getBoundingClientRect();
      if (brand.right > menu.left) found.push("헤더 메뉴가 로고와 겹침");
      if (menu.right > contact.left) found.push("헤더 메뉴가 문의 버튼과 겹침");
    }

    // 한 줄이어야 하는 글자: 헤더 메뉴, 푸터 열 제목과 링크 (높이가 한 줄 행간을 넘으면 꺾인 것)
    for (const el of document.querySelectorAll<HTMLElement>(
      "header nav a, footer nav h2, footer nav a",
    )) {
      if (!el.checkVisibility()) continue;
      const range = document.createRange();
      range.selectNodeContents(el);
      const lines = new Set(
        [...range.getClientRects()].map((r) => Math.round(r.top)),
      );
      if (lines.size > 1) found.push(`줄 꺾임 "${el.innerText.trim()}"`);
    }

    // 푸터 워드마크가 화면 안에 다 들어온다
    const wordmark = document.querySelector("footer p[aria-hidden]");
    if (wordmark) {
      const range = document.createRange();
      range.selectNodeContents(wordmark);
      const box = range.getBoundingClientRect();
      if (box.left < 0 || box.right > innerWidth)
        found.push(
          `워드마크 잘림 ${Math.round(box.left)}~${Math.round(box.right)}`,
        );
    }
    return found;
  });

for (const locale of locales)
  test(`반응형 ${locale || "/ko"}: 768/1024/1180/1280 에서 넘치거나 겹치지 않는다`, async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile",
      "뷰포트를 직접 바꾸므로 한 번만",
    );
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of paths) {
        await page.goto(`${locale}${path === "/" && locale ? "" : path}`);
        expect(await problems(page), `${width} ${locale}${path}`).toEqual([]);
      }
    }
  });
