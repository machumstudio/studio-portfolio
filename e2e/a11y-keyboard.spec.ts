import { expect, test, type Page } from "@playwright/test";

// 자동 검사(axe)로는 못 보는 접근성: 건너뛰기 링크, 포커스 표시, 움직임 멈춤, 확대(좁은 폭) 재배치.
// 나머지 키보드 흐름은 각 기능 e2e 에 있다 (docs/accessibility.md 점검표에 위치를 적었다)
const admin = { email: "admin@example.com", password: "memory-admin-password" };

const signIn = async (page: Page, path: string) => {
  await page.goto(path);
  await page.getByLabel("이메일").fill(admin.email);
  await page.getByLabel("비밀번호").fill(admin.password);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(path);
};

// 포커스된 요소 둘레(바깥 선 또는 그림자)가 보이는지
const focusIndicator = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const style = getComputedStyle(el);
    return {
      outline: style.outlineStyle !== "none" && parseFloat(style.outlineWidth),
      shadow: style.boxShadow,
    };
  });

test.describe("건너뛰기 링크", () => {
  for (const [path, label] of [
    ["/portfolio", "본문 바로가기"],
    ["/en/portfolio", "Skip to main content"],
  ] as const)
    test(`${path}: 처음 Tab 에 나타나고, 누르면 다음 Tab 이 본문 안으로 간다`, async ({
      page,
    }) => {
      await page.goto(path);
      await page.keyboard.press("Tab");
      const skip = page.getByRole("link", { name: label });
      await expect(skip).toBeFocused();
      await expect(skip).toBeInViewport();
      expect((await skip.boundingBox())!.width).toBeGreaterThan(50);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/#main$/);
      await page.keyboard.press("Tab");
      expect(
        await page.evaluate(
          () => !!document.activeElement?.closest("main#main"),
        ),
      ).toBe(true);
    });

  test("관리자: 메뉴를 건너 본문으로", async ({ page }, info) => {
    test.skip(info.project.name !== "laptop", "화면 크기와 무관");
    await signIn(page, "/admin/inquiries");
    // 주소로 새로 연 화면에서 (로그인 뒤 화면 이동은 포커스가 이어진다)
    await page.reload();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "본문 바로가기" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => !!document.activeElement?.closest("main#main")),
    ).toBe(true);
  });
});

test.describe("포커스 표시", () => {
  test("입력 칸은 포커스되면 보라 밑줄이 두꺼워진다", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel("성", { exact: true }).focus();
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByLabel("이름", { exact: true })).toBeFocused();
    expect((await focusIndicator(page)).shadow).not.toBe("none");
  });

  test("관리자 문의 카드: 카드 링크에 포커스가 가면 카드 둘레에 바깥 선", async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "laptop", "화면 크기와 무관");
    // 목록에 카드가 하나는 있게 문의를 보낸다
    await page.goto("/contact");
    await page.getByLabel("이름", { exact: true }).fill("포커스");
    await page.getByLabel("성", { exact: true }).fill("확인");
    await page.getByLabel("이메일", { exact: true }).fill("focus@example.com");
    await page.getByLabel("메시지", { exact: true }).fill("포커스 확인용");
    await page.getByRole("button", { name: "메시지 보내기" }).click();
    await expect(page.getByRole("status")).toHaveText(/메시지를 보냈습니다/);

    await signIn(page, "/admin/inquiries");
    const link = page.getByRole("link", { name: /님의 문의 열기$/ }).first();
    // 키보드 포커스(:focus-visible)가 되도록 앞 요소에서 Tab
    await page
      .getByRole("navigation", { name: "상태로 거르기" })
      .getByRole("link")
      .last()
      .focus();
    await page.keyboard.press("Tab");
    await expect(link).toBeFocused();
    const card = page
      .getByRole("list", { name: "문의 목록" })
      .getByRole("listitem")
      .first();
    expect(await card.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe(
      "solid",
    );
  });
});

test.describe("띠배너 움직임 멈추기 (WCAG 2.2.2)", () => {
  const playState = (page: Page) =>
    page
      .getByRole("contentinfo")
      .getByTestId("marquee-track")
      .evaluate((el) => getComputedStyle(el).animationPlayState);

  test("키보드: 멈춤 버튼이 포커스에서 보이고, 누르면 멈추고 다시 누르면 움직인다", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const toggle = page
      .getByRole("contentinfo")
      .getByRole("button", { name: "띠배너 멈추기" });
    await toggle.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(toggle).toBeFocused();
    await expect(toggle).toBeInViewport();
    expect(await playState(page)).toBe("running");
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(await playState(page)).toBe("paused");
    await page.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(await playState(page)).toBe("running");
  });

  test("마우스를 올리면 멈춘다", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    // 흐르는 띠 자체는 멈춰 있지 않아 띠 상자(부모)에 올린다
    await page
      .getByRole("contentinfo")
      .getByTestId("marquee-track")
      .locator("..")
      .hover();
    expect(await playState(page)).toBe("paused");
  });
});

// 확대: 1280 폭 화면을 400% 로 키운 것과 같은 320 CSS px, 200% 는 640~720.
// 가로 스크롤 없이 다시 배치되는지 본다 (WCAG 1.4.10). 띠배너와 가로로 넘기는 슬라이더는 원래 가로로 움직이는 내용이라
// 부모가 overflow 를 숨기고 있어 문서 너비 검사에서 빠진다
test.describe("확대(좁은 폭) 재배치", () => {
  const overflow = (page: Page) =>
    page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

  for (const width of [320, 640])
    test(`${width}px: 공개 화면과 관리자 화면이 가로로 넘치지 않는다`, async ({
      page,
    }, info) => {
      test.skip(
        info.project.name !== "mobile",
        "뷰포트를 직접 바꾸므로 한 번만",
      );
      await page.setViewportSize({ width, height: 800 });
      for (const path of [
        "/",
        "/about",
        "/portfolio",
        "/services",
        "/contact",
        "/work/a-wedding-tale",
        "/en",
        "/en/contact",
      ]) {
        await page.goto(path);
        expect(await overflow(page), `${width} ${path}`).toBe(0);
      }
      await signIn(page, "/admin");
      for (const path of ["/admin", "/admin/works/new", "/admin/inquiries"]) {
        await page.goto(path);
        expect(await overflow(page), `${width} ${path}`).toBe(0);
      }
    });
});
