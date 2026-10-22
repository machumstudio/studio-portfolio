import { expect, test } from "@playwright/test";

test("기본 언어는 ko, / 에서 열린다", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Machum Studio",
  );
});

test("/en 은 영어로 열린다", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("region", { name: "We are Machum" }),
  ).toBeVisible();
});

test("개발용 토큰 화면은 /tokens 에 있고, 사이트 틀 없이 검색 제외된다", async ({
  page,
}) => {
  await page.goto("/tokens");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "디자인 토큰",
  );
  await expect(page.getByRole("banner")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  await page.goto("/en/tokens");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Design tokens",
  );
});
