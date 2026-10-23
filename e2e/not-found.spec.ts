import { expect, test } from "@playwright/test";

// 어떤 경로에도 맞지 않는 주소도 404 상태로 사이트 틀(헤더/푸터) 안의 404 화면을 보여 준다
for (const [path, title] of [
  ["/nothing-here", "페이지를 찾을 수 없어요"],
  ["/en/nothing/here", "Page not found"],
]) {
  test(`${path} 는 404 화면`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });
}

test("404 화면에서 홈과 작업 목록으로 간다", async ({ page }) => {
  await page.goto("/nothing-here");
  await expect(page).toHaveTitle("페이지를 찾을 수 없음 | Machum Studio");
  await expect(page.getByRole("link", { name: "홈으로" })).toHaveAttribute(
    "href",
    "/",
  );
  await page.getByRole("link", { name: "작업 둘러보기" }).click();
  await expect(page).toHaveURL(/\/portfolio$/);
});
