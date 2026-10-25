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
      // 글자는 ::before 로 그린다. 요소 상자가 글자 폭(+ 오른쪽 여백)이다 (flex items-end)
      const box = wordmark.getBoundingClientRect();
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
  }) => {
    // 뷰포트를 직접 바꾸므로 기본 프로젝트(laptop)에서 한 번만 돈다
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of paths) {
        await page.goto(`${locale}${path === "/" && locale ? "" : path}`);
        expect(await problems(page), `${width} ${locale}${path}`).toEqual([]);
      }
    }
  });

// 푸터 링크 4열 (시안은 390 의 2x2 와 768 이상의 한 줄뿐, ADR 0022).
// 560 미만은 2열이 링크 칸 폭을 반씩 나누고, 560~767 은 4열 한 줄 양 끝 맞춤
const footerLinks = (page: Page) =>
  page.evaluate(() => {
    const ul = document.querySelector("footer nav > ul")!;
    const box = ul.getBoundingClientRect();
    const style = getComputedStyle(ul);
    const inner = {
      left: box.left + parseFloat(style.paddingLeft),
      right: box.right - parseFloat(style.paddingRight),
    };
    const columns = [...ul.children].map((li) => li.getBoundingClientRect());
    return {
      rows: new Set(columns.map((c) => Math.round(c.top))).size,
      // 열 시작 위치 (링크 칸 안쪽 왼쪽 기준)
      lefts: columns.map((c) => Math.round(c.left - inner.left)),
      half: Math.round((inner.right - inner.left + 50) / 2),
      // 마지막 열 글자의 오른쪽 끝과 링크 칸 안쪽 오른쪽의 차이
      lastGap: Math.round(
        inner.right -
          Math.max(
            ...[...ul.lastElementChild!.querySelectorAll("h2, a")].map((el) => {
              const range = document.createRange();
              range.selectNodeContents(el);
              return range.getBoundingClientRect().right;
            }),
          ),
      ),
    };
  });

for (const locale of locales)
  test(`푸터 링크 ${locale || "/ko"}: 560 미만은 반씩 2열, 560~767 은 4열 한 줄`, async ({
    page,
  }) => {
    for (const width of [390, 480, 559]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(locale || "/");
      const links = await footerLinks(page);
      expect(links.rows, `${width}`).toBe(2);
      // 둘째 열이 칸의 절반(열 간격 50 의 가운데 다음)에서 시작한다
      expect(links.lefts, `${width}`).toEqual([0, links.half, 0, links.half]);
    }
    for (const width of [560, 600, 700, 767]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(locale || "/");
      const links = await footerLinks(page);
      expect(links.rows, `${width}`).toBe(1);
      // 양 끝 맞춤: 마지막 열이 오른쪽 끝에 닿는다 (가로 넘침과 줄 꺾임은 problems 로 본다)
      expect(Math.abs(links.lastGap), `${width}`).toBeLessThanOrEqual(1);
      expect(await problems(page), `${width} ${locale}`).toEqual([]);
    }
  });
