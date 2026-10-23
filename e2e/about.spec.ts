import { expect, test } from "@playwright/test";

// /about: 메타데이터, 헤더 현재 페이지, 통계(dl), 연도별 타임라인(ol)
test("제목과 설명 메타데이터, h1", async ({ page }) => {
  await page.goto("/about");
  await expect(page).toHaveTitle("소개 | Machum Studio");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /마춤 스튜디오의 이야기/,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "마춤 스튜디오 소개",
  );
});

test("헤더: 데스크톱 메뉴의 소개만 현재 페이지", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "데스크톱 메뉴는 lg 부터");
  await page.goto("/about");
  const nav = page.getByRole("banner").getByRole("navigation");
  await expect(nav.locator("[aria-current]")).toHaveText(["소개"]);
});

test("헤더: 모바일 메뉴의 소개만 현재 페이지", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "모바일 메뉴는 lg 미만");
  await page.goto("/about");
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  const nav = page.getByRole("navigation", { name: "주요 메뉴" });
  await expect(nav.locator("[aria-current]")).toHaveText(["소개"]);
});

test("통계 6개가 설명-숫자 쌍으로 보인다", async ({ page }) => {
  await page.goto("/about");
  const stats = page.locator("dl");
  await expect(stats.getByRole("term")).toHaveCount(6);
  await expect(stats.getByRole("definition")).toHaveText([
    "15+",
    "500+",
    "10+",
    "05+",
    "10,000+",
    "90%",
  ]);
  // 보이는 순서는 숫자가 위
  const value = await stats.getByRole("definition").first().boundingBox();
  const label = await stats.getByRole("term").first().boundingBox();
  expect(value!.y).toBeLessThan(label!.y);
});

test("타임라인은 2005 ~ 2020 여섯 해를 순서대로 보여준다 (lg 부터 2열)", async ({
  page,
}, info) => {
  await page.goto("/about");
  const timeline = page.getByRole("region", { name: "마춤 스튜디오의 발자취" });
  const list = timeline.getByRole("list");
  await expect(list.getByRole("heading", { level: 3 })).toHaveText([
    "2005년",
    "2010년",
    "2012년",
    "2015년",
    "2017년",
    "2020년",
  ]);
  const [first, second] = await list
    .getByRole("listitem")
    .evaluateAll((els) =>
      els.slice(0, 2).map((el) => el.getBoundingClientRect().y),
    );
  if (info.project.name === "mobile") expect(second).toBeGreaterThan(first);
  else expect(second).toBe(first);
});

test("영어 페이지는 Year - 2005 형식", async ({ page }) => {
  await page.goto("/en/about");
  await expect(page).toHaveTitle("About | Machum Studio");
  await expect(
    page.getByRole("heading", { level: 3, name: "Year - 2005" }),
  ).toBeVisible();
});
