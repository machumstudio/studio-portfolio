import { expect, test } from "@playwright/test";

// 홈 Hero, About: 실제 CSS 로만 확인되는 배치 (콜라주 칸이 화면 안에 있는지, 태블릿 폭)
test("이름이 h1, 히어로 CTA 는 문의 페이지로 간다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Machum Studio",
  );
  const hero = page.getByRole("region", { name: "Machum Studio" });
  await expect(hero.getByRole("link", { name: "문의하기" })).toHaveAttribute(
    "href",
    "/contact",
  );
});

test("콜라주 7칸은 모두 콘텐츠 폭 안에 있다 (태블릿 768 포함)", async ({
  page,
}) => {
  for (const width of [page.viewportSize()!.width, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const tiles = page
      .getByRole("region", { name: "Machum Studio" })
      .locator("[data-visual-mask]");
    await expect(tiles).toHaveCount(7);
    for (const box of await tiles.evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().toJSON()),
    )) {
      expect(box.width).toBeGreaterThan(0);
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(width);
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    );
    expect(overflow).toBe(0);
  }
});

test("About: 소개서 내려받기는 준비 중이라 Tab 으로 건너뛴다", async ({
  page,
}) => {
  await page.goto("/");
  const about = page.getByRole("region", { name: "마춤 스튜디오입니다" });
  const work = about.getByRole("link", { name: "함께 작업하기" });
  await expect(work).toHaveAttribute("href", "/contact");
  await expect(
    about.getByRole("button", { name: /소개서 내려받기/ }),
  ).toBeDisabled();
  // 함께 작업하기 다음 Tab 은 About 밖(FAQ)으로 나간다
  await work.focus();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () => !!document.activeElement?.closest('[aria-labelledby="faq-title"]'),
    ),
  ).toBe(true);
});
