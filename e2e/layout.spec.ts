import { expect, type Page, test } from "@playwright/test";

// 헤더/푸터 동작 중 jsdom 으로 확인할 수 없는 것 (실제 CSS, 미디어 쿼리)
test.describe("카테고리 마키", () => {
  const animationName = (page: Page) =>
    page
      .getByRole("contentinfo")
      .getByTestId("marquee-track")
      .evaluate((el) => getComputedStyle(el).animationName);

  test("기본은 흐른다", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    expect(await animationName(page)).toBe("marquee");
  });

  test("prefers-reduced-motion: reduce 이면 멈춘다", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    expect(await animationName(page)).toBe("none");
  });
});

test.describe("헤더", () => {
  test(
    "현재 페이지(홈)에 aria-current 가 붙는다",
    { tag: "@responsive" },
    async ({ page }, info) => {
      test.skip(info.project.name === "mobile", "데스크톱 메뉴는 lg 부터");
      await page.goto("/");
      const nav = page.getByRole("banner").getByRole("navigation");
      await expect(nav.getByRole("link", { name: "홈" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(nav.locator("[aria-current]")).toHaveCount(1);
      await expect(
        page.getByRole("button", { name: "메뉴 열기" }),
      ).toBeHidden();
    },
  );

  test(
    "모바일 메뉴: 열기 → Tab 트랩 → Esc 로 닫고 버튼으로 포커스 복귀",
    { tag: "@responsive" },
    async ({ page }, info) => {
      test.skip(info.project.name !== "mobile", "모바일 메뉴는 lg 미만");
      await page.goto("/");
      const toggle = page.getByRole("button", { name: "메뉴 열기" });
      await toggle.click();
      const nav = page.getByRole("navigation", { name: "주요 메뉴" });
      await expect(nav).toBeVisible();
      await expect(nav.getByRole("link", { name: "홈" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(nav.getByRole("link", { name: "홈" })).toBeFocused();

      // 링크 4개 + 문의 버튼을 지나면 다시 토글 버튼으로 돌아온다
      for (let i = 0; i < 5; i++) await page.keyboard.press("Tab");
      await expect(
        page.getByRole("button", { name: "메뉴 닫기" }),
      ).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(nav).toBeHidden();
      await expect(toggle).toBeFocused();
    },
  );

  test(
    "가로 스크롤이 생기지 않는다",
    { tag: "@responsive" },
    async ({ page }) => {
      await page.goto("/");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      );
      expect(overflow).toBe(0);
    },
  );
});
