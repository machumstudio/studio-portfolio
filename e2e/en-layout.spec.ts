import { expect, test, type Page } from "@playwright/test";

// 영어 문구는 한국어보다 길어서 버튼, 제목, 카드가 넘치기 쉽다.
// /en 의 모든 화면을 시안 뷰포트(프로젝트 3종)와 태블릿 768 에서 열어 가로 넘침이 없는지 본다
const pages = [
  "/en",
  "/en/about",
  "/en/portfolio",
  "/en/services",
  "/en/contact",
  "/en/work/a-wedding-tale",
  "/en/nope",
];

// 글자가 자기 상자를 넘치는 버튼, 링크, 제목, 입력 칸 이름. 줄바꿈되지 않는 문구가 잘리거나 삐져나온 것이다.
// 화면 밖으로 밀어 둔 슬라이드(가로로 넘기는 목록)는 overflow 를 숨긴 부모 안에 있어 문서 너비 검사에서 빠진다.
// 화면 읽기 전용 제목(sr-only, 1px 상자)은 일부러 넘치게 둔 것이라 뺀다
const overflowingText = (page: Page) =>
  page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        "main :is(h1, h2, h3, a, button, label), header :is(a, button), footer :is(a, h2, h3)",
      ),
    ]
      .filter((el) => el.clientWidth > 1 && el.checkVisibility())
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map(
        (el) =>
          `${el.tagName.toLowerCase()} "${el.innerText.trim().slice(0, 40)}"`,
      ),
  );

const check = async (page: Page, path: string) => {
  await page.goto(path);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - innerWidth,
  );
  expect(overflow, `${path} 가로 넘침`).toBe(0);
  expect(await overflowingText(page), `${path} 글자 넘침`).toEqual([]);
};

for (const path of pages)
  test(`en 레이아웃: ${path} 가 넘치지 않는다`, async ({ page }) => {
    await check(page, path);
  });

test("en 레이아웃: 태블릿 768 에서도 넘치지 않는다", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "mobile",
    "뷰포트를 직접 바꾸므로 한 번만",
  );
  await page.setViewportSize({ width: 768, height: 1024 });
  for (const path of pages) await check(page, path);
});
