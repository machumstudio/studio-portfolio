import { expect, type Page, test } from "@playwright/test";

// /work/[slug]: 진입, 메타데이터, 이전/다음, 404, 라이트박스 키보드
const dialog = (page: Page) => page.getByRole("dialog");
const position = (page: Page) => dialog(page).locator("[aria-live]");

test("Portfolio 카드에서 상세로 들어오면 제목(h1), 카테고리, 연월, 대표 사진과 갤러리가 있다", async ({
  page,
}) => {
  await page.goto("/portfolio?category=events");
  await page
    .getByRole("link", { name: /^프로젝트 보기.*어느 결혼식 이야기/ })
    .click();
  await expect(page).toHaveURL(/\/work\/a-wedding-tale$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "어느 결혼식 이야기",
  );
  // 클라이언트 이동 뒤에는 이전 페이지가 숨은 채 남아 있을 수 있어 상세 article 안에서 찾는다
  const article = page.getByRole("article", { name: "어느 결혼식 이야기" });
  await expect(article.getByText("2021년 9월")).toBeVisible();
  await expect(
    article.getByRole("region", { name: "사진 3장" }).getByRole("button"),
  ).toHaveCount(3);
  await expect(page).toHaveTitle("어느 결혼식 이야기 | Machum Studio");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /\/images\/works\/a-wedding-tale-1\.jpg$/,
  );
});

test("이전/다음 작업은 Portfolio 순서(카테고리 순서, 최신순)로 이어진다", async ({
  page,
}) => {
  await page.goto("/work/a-wedding-tale");
  const pager = page.getByRole("navigation", { name: "다른 작업" });
  await expect(pager.getByRole("link")).toHaveText([
    /이전 작업.*있는 그대로의 순수/,
    /다음 작업.*기업 리더십 서밋/,
  ]);
  await pager.getByRole("link", { name: /다음 작업/ }).click();
  await expect(page).toHaveURL(/\/work\/corporate-excellence-summit$/);
});

for (const [label, path] of [
  ["비공개 작업", "/work/behind-the-scenes"],
  ["없는 slug", "/work/nope"],
  ["주소에 맞지 않는 slug", "/work/Not_A_Slug"],
  ["영어 없는 slug", "/en/work/nope"],
]) {
  test(`${label}(${path})는 404 상태로 사이트 틀 안의 404 화면`, async ({
    page,
  }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      path.startsWith("/en") ? "Page not found" : "페이지를 찾을 수 없어요",
    );
    await expect(page.getByRole("banner")).toBeVisible();
    // Next 가 404 응답에 붙이는 noindex (운영 배포에서도 붙는다. 미리보기는 레이아웃의 noindex, nofollow 가 하나 더 있다)
    await expect(
      page.locator('meta[name="robots"][content="noindex"]'),
    ).toHaveCount(1);
  });
}

test("라이트박스: 키보드로 열고, ←/→ 로 넘기고, Tab 은 안에서 돌고, Esc 로 닫으면 썸네일로 돌아간다", async ({
  page,
}) => {
  await page.goto("/work/faces-of-resilience");
  const thumb = page.getByRole("button", { name: "사진 2 크게 보기" });
  await thumb.focus();
  await page.keyboard.press("Enter");

  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page)).toHaveAccessibleName("단단한 얼굴들 사진");
  await expect(dialog(page)).toHaveAttribute("aria-modal", "true");
  await expect(
    dialog(page).getByRole("button", { name: "닫기" }),
  ).toBeFocused();
  await expect(position(page)).toHaveText("2 / 3");

  await page.keyboard.press("ArrowRight");
  await expect(position(page)).toHaveText("3 / 3");
  await page.keyboard.press("ArrowRight");
  await expect(position(page)).toHaveText("1 / 3");
  await page.keyboard.press("ArrowLeft");
  await expect(position(page)).toHaveText("3 / 3");

  // 닫기 → 이전 → 다음 → 다시 닫기 (바깥으로 나가지 않는다)
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press(i % 2 ? "Shift+Tab" : "Tab");
    expect(
      await page.evaluate(() => !!document.activeElement?.closest("dialog")),
    ).toBe(true);
  }
  for (let i = 0; i < 3; i++) await page.keyboard.press("Tab");
  await expect(
    dialog(page).getByRole("button", { name: "닫기" }),
  ).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(thumb).toBeFocused();
});

test("라이트박스: 닫기 버튼, 스와이프", async ({ page }) => {
  await page.goto("/work/faces-of-resilience");
  const thumb = page.getByRole("button", { name: "사진 1 크게 보기" });
  await thumb.click();
  // 사진 설명(alt)이 빈 임시 이미지라 img 역할이 없다
  const area = dialog(page).locator("img").locator("..");
  const box = (await area.boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.7, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, y, { steps: 5 });
  await page.mouse.up();
  await expect(position(page)).toHaveText("2 / 3");

  await dialog(page).getByRole("button", { name: "닫기" }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(thumb).toBeFocused();
});

test(
  "작업 상세에서는 헤더의 포트폴리오가 현재 페이지다",
  { tag: "@responsive" },
  async ({ page }, info) => {
    test.skip(info.project.name === "mobile", "데스크톱 메뉴는 lg 부터");
    await page.goto("/work/a-wedding-tale");
    const nav = page.getByRole("banner").getByRole("navigation");
    await expect(nav.locator("[aria-current]")).toHaveText(["포트폴리오"]);
  },
);
