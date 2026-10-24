import { expect, test } from "@playwright/test";

// /services: 메타데이터, 헤더 현재 페이지, 서비스별 가격 패키지(PriceCard), 가격 표기 ko/en
test("제목과 설명 메타데이터, h1", async ({ page }) => {
  await page.goto("/services");
  await expect(page).toHaveTitle("서비스 | Machum Studio");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /촬영 패키지와 가격/,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "다양한 촬영 서비스",
  );
});

test("헤더: 데스크톱 메뉴의 서비스만 현재 페이지", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "데스크톱 메뉴는 lg 부터");
  await page.goto("/services");
  const nav = page.getByRole("banner").getByRole("navigation");
  await expect(nav.locator("[aria-current]")).toHaveText(["서비스"]);
});

test("헤더: 모바일 메뉴의 서비스만 현재 페이지", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "모바일 메뉴는 lg 미만");
  await page.goto("/services");
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  const nav = page.getByRole("navigation", { name: "주요 메뉴" });
  await expect(nav.locator("[aria-current]")).toHaveText(["서비스"]);
});

test("서비스 셋에 패키지 카드가 셋씩, 포함 항목은 목록", async ({ page }) => {
  await page.goto("/services");
  const sections = page.locator("#packages > section");
  await expect(sections).toHaveCount(3);
  await expect(sections.getByRole("heading", { level: 2 })).toHaveText([
    "인물 촬영",
    "이벤트 촬영",
    "광고 촬영",
  ]);

  const portrait = page.getByRole("region", { name: "인물 촬영" });
  const cards = portrait.getByRole("article");
  await expect(cards.getByRole("heading", { level: 3 })).toHaveText([
    "개인 촬영",
    "가족 촬영",
    "커플 촬영",
  ]);
  await expect(cards.first().getByRole("listitem")).toHaveCount(3);
  await expect(
    cards.first().getByRole("link", { name: /^상담 예약\s*: 개인 촬영$/ }),
  ).toHaveAttribute("href", "/contact");
  await expect(page.getByRole("article")).toHaveCount(9);
});

test("lg 부터 패키지 이름/가격 칸과 포함 항목이 한 줄", async ({
  page,
}, info) => {
  await page.goto("/services");
  const card = page.getByRole("article", { name: "개인 촬영" });
  const price = await card.getByText("₩25만").boundingBox();
  const list = await card.getByRole("list").boundingBox();
  if (info.project.name === "mobile")
    expect(list!.y).toBeGreaterThan(price!.y + price!.height);
  else expect(list!.x).toBeGreaterThan(price!.x + price!.width);
});

test("가격 표기: ko 는 ₩25만, 가격이 없으면 맞춤 견적", async ({ page }) => {
  await page.goto("/services");
  const individual = page.getByRole("article", { name: "개인 촬영" });
  await expect(individual.locator("data")).toHaveText("₩25만");
  await expect(individual.locator("data")).toHaveAttribute("value", "250000");
  await expect(
    page.getByRole("article", { name: "웨딩 촬영" }).locator("data"),
  ).toHaveText("₩150만");
  await expect(
    page
      .getByRole("article", { name: "기업 행사" })
      .getByText("맞춤 견적", { exact: true }),
  ).toBeVisible();
});

test("가격 표기: en 은 같은 원화를 ₩250K 로", async ({ page }) => {
  await page.goto("/en/services");
  await expect(page).toHaveTitle("Services | Machum Studio");
  const individual = page.getByRole("article", { name: "Individual Session" });
  await expect(individual.locator("data")).toHaveText("₩250K");
  await expect(individual.locator("data")).toHaveAttribute("value", "250000");
  await expect(
    page.getByRole("article", { name: "Wedding Photography" }).locator("data"),
  ).toHaveText("₩1.5M");
  await expect(
    page
      .getByRole("article", { name: "Corporate Events" })
      .getByText("Custom Pricing", { exact: true }),
  ).toBeVisible();
});

test("서비스 사진은 화살표로 넘긴다", async ({ page }) => {
  await page.goto("/services");
  const slider = page.getByRole("group", { name: "인물 촬영 사진" });
  const previous = slider.getByRole("button", { name: "이전 인물 촬영 사진" });
  await expect(previous).toHaveAttribute("aria-disabled", "true");
  await slider.getByRole("button", { name: "다음 인물 촬영 사진" }).click();
  await expect(previous).toHaveAttribute("aria-disabled", "false");
  await expect(slider.getByRole("group", { name: "2 / 3" })).toBeVisible();
});

test("홈 서비스 슬라이더의 /services#id 가 해당 서비스 섹션으로 간다", async ({
  page,
}) => {
  await page.goto("/services#events");
  await expect(page.locator("#events")).toBeInViewport();
});

test("작업 보기는 Portfolio 의 같은 분야 필터로 간다", async ({ page }) => {
  await page.goto("/services");
  await page.getByRole("link", { name: /^작업 보기\s*: 광고 촬영$/ }).click();
  await expect(page).toHaveURL(/\/portfolio\?category=commercial$/);
});
