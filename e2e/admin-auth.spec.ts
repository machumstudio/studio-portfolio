import { expect, test, type Page } from "@playwright/test";

// 관리자 인증 (DATA_STORE=memory 의 테스트 계정, src/infrastructure/admin-auth/memory-accounts.ts).
// 실제 관리자 계정은 쓰지 않는다. 세션은 서버 메모리에 있고 테스트마다 브라우저 컨텍스트(쿠키)가 다르다
const admin = { email: "admin@example.com", password: "memory-admin-password" };
const editor = {
  email: "editor@example.com",
  password: "memory-editor-password",
};
const failure = "이메일 또는 비밀번호가 올바르지 않습니다.";

const signIn = async (
  page: Page,
  { email, password }: { email: string; password: string },
) => {
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();
};

// 로그인 뒤 첫 화면(/admin)은 작업 목록 (18칸)
const dashboard = (page: Page) =>
  expect(page.getByRole("heading", { level: 1, name: "작업" })).toBeVisible();

test.describe("비로그인", () => {
  test("/admin → 로그인 화면 (돌아올 곳이 기본이면 next 없음)", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page).toHaveTitle("관리자 로그인 | Machum Studio");
    await expect(
      page.getByRole("heading", { level: 1, name: "관리자 로그인" }),
    ).toBeVisible();
  });

  test("하위 경로 → 로그인 화면, 돌아올 곳을 next 로 보존", async ({
    page,
  }) => {
    await page.goto("/admin/works?draft=1");
    await expect(page).toHaveURL(
      "/admin/login?next=%2Fadmin%2Fworks%3Fdraft%3D1",
    );
  });

  test("위조한 세션 쿠키는 proxy 를 지나도 서버 확인에서 로그인으로", async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([
      {
        name: "machum-admin-session",
        value: "00000000-0000-4000-8000-000000000000",
        url: `${baseURL}/admin`,
      },
    ]);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("/en/admin 은 없는 페이지 (관리자는 한국어만)", async ({ page }) => {
    const response = await page.goto("/en/admin");
    expect(response?.status()).toBe(404);
  });

  test("로그인 화면: 검색 제외, 가입/비밀번호 찾기 링크 없음", async ({
    page,
  }) => {
    const response = await page.goto("/admin/login");
    expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
    await expect(page.locator("html")).toHaveAttribute("lang", "ko");
    await expect(page.getByRole("link")).toHaveCount(0);
    await expect(
      page.getByText(/가입|비밀번호 찾기|비밀번호를 잊/),
    ).toHaveCount(0);
  });
});

test.describe("로그인", () => {
  test("성공 → /admin 대시보드", async ({ page }) => {
    await page.goto("/admin/login");
    await signIn(page, admin);
    await expect(page).toHaveURL(/\/admin$/);
    await dashboard(page);
    await expect(page.getByText(admin.email)).toBeVisible();
  });

  test("세션 쿠키는 httpOnly, path=/admin", async ({ page, context }) => {
    await page.goto("/admin/login");
    await signIn(page, admin);
    await dashboard(page);
    const [cookie] = await context.cookies();
    expect(cookie).toMatchObject({
      name: "machum-admin-session",
      path: "/admin",
      httpOnly: true,
      sameSite: "Lax",
    });
  });

  test("실패: 틀린 비밀번호, 없는 이메일, 관리자 아닌 계정 모두 같은 문구", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    for (const credentials of [
      { email: admin.email, password: "wrong-password" },
      { email: "nobody@example.com", password: admin.password },
      editor,
    ]) {
      await signIn(page, credentials);
      await expect(page.getByRole("status")).toHaveText(failure);
      await expect(page).toHaveURL(/\/admin\/login$/);
      await expect(page.getByLabel("이메일")).toHaveValue(credentials.email);
      await expect(page.getByLabel("비밀번호")).toHaveValue("");
      await expect(page.getByLabel("비밀번호")).toBeFocused();
    }
    // 관리자가 아닌 계정의 세션도 남지 않는다
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("빈 칸 → 입력 안내, 이메일에 포커스", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page.getByRole("status")).toHaveText(
      "이메일과 비밀번호를 입력해 주세요.",
    );
    await expect(page.getByLabel("이메일")).toBeFocused();
  });

  test("next 의 /admin 경로로 돌아간다", async ({ page }) => {
    await page.goto("/admin/works/new?from=list");
    await signIn(page, admin);
    await expect(page).toHaveURL("/admin/works/new?from=list");
    await expect(
      page.getByRole("heading", { level: 1, name: "새 작업" }),
    ).toBeVisible();
  });

  for (const next of [
    "https://evil.example/admin",
    "//evil.example",
    "/\\evil.example",
    "/%5Cevil.example",
    "/contact",
  ])
    test(`open redirect 차단: next=${next} → /admin`, async ({ page }) => {
      await page.goto(`/admin/login?next=${encodeURIComponent(next)}`);
      await signIn(page, admin);
      await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/admin$/);
      await dashboard(page);
    });
});

test.describe("로그아웃", () => {
  test("로그아웃 → 로그인 화면, 그 뒤 /admin 은 다시 로그인으로", async ({
    page,
    context,
  }) => {
    await page.goto("/admin/login");
    await signIn(page, admin);
    await dashboard(page);
    const [session] = await context.cookies();

    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    expect(await context.cookies()).toEqual([]);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);

    // 로그아웃 전 쿠키를 다시 넣어도 끝난 세션이다
    await context.addCookies([session]);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});

test.describe("JS 끈 상태", () => {
  test.use({ javaScriptEnabled: false });

  test("로그인 실패와 성공, 로그아웃이 일반 POST 로 된다", async ({ page }) => {
    await page.goto("/admin/works/new");
    await signIn(page, { email: admin.email, password: "wrong-password" });
    await expect(page.getByRole("status")).toHaveText(failure);
    await expect(page.getByLabel("이메일")).toHaveValue(admin.email);
    await expect(page.getByLabel("비밀번호")).toBeFocused();

    await signIn(page, admin);
    await expect(page).toHaveURL("/admin/works/new");
    // 편집 화면은 JS 를 전제로 한다 (docs/adr/0015). 꺼져 있으면 noscript 안내가 보인다.
    // Playwright 의 JS 끄기는 HTML 파서의 scripting 을 끄지 않아 noscript 를 그리지 않으므로 마크업으로 확인한다
    await expect(page.locator("noscript")).toHaveCount(1);
    expect(await page.locator("noscript").textContent()).toContain(
      "자바스크립트가 필요합니다",
    );

    await page.goto("/admin");
    await dashboard(page);
    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});
