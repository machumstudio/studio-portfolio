import { expect, test } from "@playwright/test";

test("기본 언어는 ko, / 에서 열린다", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "디자인 토큰",
  );
});

test("/en 은 영어로 열린다", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Design tokens",
  );
});
