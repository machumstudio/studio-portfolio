import { expect, type Page, test } from "@playwright/test";

// /portfolio: 카테고리 필터는 ?category= 주소 (서버에서 거른다). 공유/새로고침/뒤로가기가 되는지 브라우저에서 확인한다
const galleryTitles = (page: Page) =>
  page.locator("#works").getByRole("heading", { level: 2 });
const filter = (page: Page) =>
  page.getByRole("navigation", { name: "분야별로 보기" });

test("기본은 인물, 이벤트, 광고 갤러리가 모두 있고 전체가 현재 필터", async ({
  page,
}) => {
  await page.goto("/portfolio");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "픽셀로 쓴 시",
  );
  await expect(galleryTitles(page)).toHaveText([
    "인물 사진",
    "이벤트 사진",
    "광고 사진",
  ]);
  await expect(
    filter(page).getByRole("link", { name: "전체" }),
  ).toHaveAttribute("aria-current", "page");
  // 비공개 작업은 어느 갤러리에도 없다
  await expect(page.getByText("촬영 현장 기록")).toHaveCount(0);
});

test("필터를 누르면 ?category= 주소가 되고, 뒤로/앞으로 가기로 오간다", async ({
  page,
}) => {
  await page.goto("/portfolio");
  await filter(page).getByRole("link", { name: "이벤트" }).click();
  await expect(page).toHaveURL(/\/portfolio\?category=events$/);
  await expect(galleryTitles(page)).toHaveText(["이벤트 사진"]);
  await expect(
    filter(page).getByRole("link", { name: "이벤트" }),
  ).toHaveAttribute("aria-current", "page");

  await page.goBack();
  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(galleryTitles(page)).toHaveCount(3);

  await page.goForward();
  await expect(page).toHaveURL(/\/portfolio\?category=events$/);
  await expect(galleryTitles(page)).toHaveText(["이벤트 사진"]);
});

test("공유한 주소로 바로 들어와도 그 카테고리만 보인다 (영어 포함)", async ({
  page,
}) => {
  await page.goto("/portfolio?category=commercial");
  await expect(galleryTitles(page)).toHaveText(["광고 사진"]);
  await expect(
    page.locator("#works").getByRole("link", { name: /^프로젝트 보기/ }),
  ).toHaveCount(3);

  await page.goto("/en/portfolio?category=portrait");
  await expect(galleryTitles(page)).toHaveText(["Portraits Photography"]);
  await expect(
    page
      .getByRole("navigation", { name: "Browse by category" })
      .getByRole("link", { name: "Portraits" }),
  ).toHaveAttribute("aria-current", "page");
});

test("모르는 카테고리 값은 404 가 아니라 전체를 보여 준다", async ({
  page,
}) => {
  const response = await page.goto("/portfolio?category=wedding");
  expect(response?.status()).toBe(200);
  await expect(galleryTitles(page)).toHaveCount(3);
});

test("홈의 모든 작업 보기에서 들어온다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "모든 작업 보기" }).click();
  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "픽셀로 쓴 시",
  );
});
