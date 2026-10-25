import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// 접근성 자동 검사 (axe). 기준: 위반 0 (WCAG 2.2 A/AA + axe best-practice).
// 공개 6페이지 ko/en 과 관리자 화면(한국어만, docs/adr/0013)을 세 화면 크기에서 본다.
// 열리는 것(모바일 메뉴, FAQ 답, 라이트박스, 확인 창)과 오류 문구가 보이는 상태도 같이 본다.
// 자동 검사로 못 보는 것(키보드 흐름, 포커스 순서, 확대)은 docs/accessibility.md 점검표
const tags = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
  "best-practice",
];

// 실패하면 규칙, 요소, 이유를 한 줄씩 보여 준다
const expectNoViolations = async (page: Page, label: string) => {
  const { violations } = await new AxeBuilder({ page })
    .withTags(tags)
    .analyze();
  const found = violations.flatMap((violation) =>
    violation.nodes.map(
      (node) =>
        `${violation.id} (${violation.impact}) ${node.target.join(" ")}: ${
          node.failureSummary?.split("\n")[1]?.trim() ?? violation.help
        }`,
    ),
  );
  expect(found, `${label} 의 axe 위반`).toEqual([]);
};

const publicPages = [
  "/",
  "/about",
  "/services",
  "/portfolio",
  "/work/a-wedding-tale",
  "/contact",
];

for (const locale of ["ko", "en"] as const) {
  const prefix = locale === "ko" ? "" : "/en";

  test.describe(`공개 화면 ${locale}`, () => {
    for (const path of publicPages)
      test(`${prefix}${path}`, async ({ page }) => {
        await page.goto(`${prefix}${path}`);
        await expectNoViolations(page, `${prefix}${path}`);
      });

    test("404 화면", async ({ page }) => {
      await page.goto(`${prefix}/no-such-page`);
      await expectNoViolations(page, "404");
    });

    test("열린 상태: 모바일 메뉴, FAQ 답, 라이트박스", async ({
      page,
    }, info) => {
      await page.goto(`${prefix}/`);
      if (info.project.name === "mobile") {
        await page
          .getByRole("button", {
            name: locale === "ko" ? "메뉴 열기" : /menu/i,
          })
          .click();
        await expectNoViolations(page, "모바일 메뉴");
        await page.keyboard.press("Escape");
      }
      await page.locator("[data-accordion-header]").first().click();
      await expectNoViolations(page, "FAQ 답");

      await page.goto(`${prefix}/work/a-wedding-tale`);
      await page.locator("button[aria-haspopup=dialog]").first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expectNoViolations(page, "라이트박스");
    });

    test("문의 폼 오류 문구", async ({ page }) => {
      await page.goto(`${prefix}/contact`);
      await page
        .getByRole("button", {
          name: locale === "ko" ? "메시지 보내기" : /send/i,
        })
        .click();
      await expect(page.locator("[aria-invalid=true]").first()).toBeVisible();
      await expectNoViolations(page, "문의 폼 오류");
    });
  });
}

const admin = { email: "admin@example.com", password: "memory-admin-password" };

test.describe("관리자 화면", () => {
  test("로그인 (빈 칸 오류 포함)", async ({ page }) => {
    await page.goto("/admin/login");
    await expectNoViolations(page, "로그인");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page.locator("[aria-invalid=true]").first()).toBeVisible();
    await expectNoViolations(page, "로그인 오류");
  });

  test("작업 목록, 새 작업(오류 포함), 작업 편집, 지우기 확인 창", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await page.getByLabel("이메일").fill(admin.email);
    await page.getByLabel("비밀번호").fill(admin.password);
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page).toHaveURL("/admin");
    await expectNoViolations(page, "작업 목록");

    await page.goto("/admin/works/new");
    await expectNoViolations(page, "새 작업");
    await page.getByRole("button", { name: "저장", exact: true }).click();
    await expect(page.locator("[aria-invalid=true]").first()).toBeVisible();
    await expectNoViolations(page, "새 작업 오류");

    await page.goto("/admin");
    await page
      .getByRole("link", { name: /고치기$/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/admin\/works\/[^/]+$/);
    await expectNoViolations(page, "작업 편집");
    await page.getByRole("button", { name: "작업 지우기" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoViolations(page, "작업 지우기 확인 창");
  });

  test("문의 목록, 문의 상세, 지우기 확인 창", async ({ page }) => {
    // 볼 문의를 하나 만든다 (다른 e2e 와 같은 인메모리 저장소. 개수에 기대지 않는다)
    const run = Date.now().toString(36);
    await page.goto("/contact");
    await page.getByLabel("이름", { exact: true }).fill(`접근성${run}`);
    await page.getByLabel("성", { exact: true }).fill("검사");
    await page
      .getByLabel("이메일", { exact: true })
      .fill(`a11y-${run}@example.com`);
    await page
      .getByLabel("메시지", { exact: true })
      .fill("접근성 검사용 문의입니다.");
    await page.getByRole("button", { name: "메시지 보내기" }).click();
    await expect(page.getByRole("status")).toHaveText(/메시지를 보냈습니다/);

    await page.goto("/admin/login");
    await page.getByLabel("이메일").fill(admin.email);
    await page.getByLabel("비밀번호").fill(admin.password);
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page).toHaveURL("/admin");

    await page.goto("/admin/inquiries");
    await expectNoViolations(page, "문의 목록");
    await page
      .getByRole("link", { name: `접근성${run} 검사 님의 문의 열기` })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      `접근성${run} 검사 님의 문의`,
    );
    await expectNoViolations(page, "문의 상세");
    await page.getByRole("button", { name: "문의 지우기" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoViolations(page, "문의 지우기 확인 창");
  });
});
