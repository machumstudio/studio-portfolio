import { expect, test, type Page } from "@playwright/test";

// 관리자 문의 관리 (DATA_STORE=memory: 공개 문의 폼과 관리자 화면이 같은 인메모리 저장소, 테스트 계정).
// 다른 e2e(문의 제출)도 같은 서버에 문의를 넣으므로 테스트마다 실행별로 다른 이름의 문의를 만들고 그 문의만 본다.
// 개수는 다른 테스트가 언제 문의를 넣을지 몰라 절대값 대신 "같은 화면 안에서 메뉴와 필터가 같은지"와
// "내 문의가 어느 필터에 있는지"로 본다. 상태를 바꾸는 흐름은 기본 프로젝트(laptop)에서만 돈다 (playwright.config.ts)
const admin = { email: "admin@example.com", password: "memory-admin-password" };

const signIn = async (page: Page, path: string) => {
  await page.goto(path);
  await page.getByLabel("이메일").fill(admin.email);
  await page.getByLabel("비밀번호").fill(admin.password);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(path);
};

type Submitted = { name: string; email: string; message: string };

// 공개 문의 폼으로 새 문의를 보낸다 (이름: 이름 성 순서로 관리자 화면에 보인다)
const submitInquiry = async (page: Page): Promise<Submitted> => {
  const run = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const first = `손님${run}`;
  const inquiry = {
    name: `${first} 테스트`,
    email: `guest-${run}@example.com`,
    message: `가족사진 촬영 문의드립니다.\n\n- 4명\n- 11월 주말 (${run})`,
  };
  await page.goto("/contact");
  await page.getByLabel("이름", { exact: true }).fill(first);
  await page.getByLabel("성", { exact: true }).fill("테스트");
  await page.getByLabel("이메일", { exact: true }).fill(inquiry.email);
  await page.getByLabel("메시지", { exact: true }).fill(inquiry.message);
  await page.getByRole("button", { name: "메시지 보내기" }).click();
  await expect(page.getByRole("status")).toHaveText(/메시지를 보냈습니다/);
  return inquiry;
};

const list = (page: Page) => page.getByRole("list", { name: "문의 목록" });
const card = (page: Page, { name }: Submitted) =>
  list(page)
    .getByRole("listitem")
    .filter({
      has: page.getByRole("link", { name: `${name} 님의 문의 열기` }),
    });
const filters = (page: Page) =>
  page.getByRole("navigation", { name: "상태로 거르기" });
const menuInquiries = (page: Page) =>
  page
    .getByRole("navigation", { name: "관리자 메뉴" })
    .getByRole("link", { name: /^문의/ });
const handling = (page: Page) => page.getByRole("region", { name: "처리" });
const notice = (page: Page) => page.getByRole("status");
// 상세 제목 옆의 상태 표시
const statusBadge = (page: Page) =>
  page.locator("article > header").getByText(/^(새 문의|확인|완료)$/);

const filterBy = async (page: Page, label: RegExp) => {
  await filters(page).getByRole("link", { name: label }).click();
  await expect(
    filters(page).getByRole("link", { name: label }),
  ).toHaveAttribute("aria-current", "page");
};

// 같은 화면에서 메뉴의 "새 문의 N건"과 필터의 "새 문의 N건"이 같은지
const expectNewCountsAgree = async (page: Page) => {
  const filter = await filters(page)
    .getByRole("link", { name: /^새 문의/ })
    .textContent();
  const count = Number(/(\d+)건/.exec(filter ?? "")?.[1]);
  if (count > 0)
    await expect(menuInquiries(page)).toHaveText(`문의 새 문의 ${count}건`);
  else await expect(menuInquiries(page)).toHaveText("문의");
};

const openDetail = async (page: Page, inquiry: Submitted) => {
  await page.goto("/admin/inquiries");
  await card(page, inquiry)
    .getByRole("link", { name: `${inquiry.name} 님의 문의 열기` })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    `${inquiry.name} 님의 문의`,
  );
  return page.url();
};

test.describe("문의 처리 흐름", () => {
  // 납품 확인용 흐름 ① (pnpm test:delivery): "문의 누락 없이". 방문자가 보낸 문의가 관리자 목록에 새 문의로 오고, 처리 상태가 남는다
  test(
    "납품 확인 ① 방문자 문의 제출 → 관리자 로그인 → 목록에 새 문의 → 상세(열어도 그대로) → 확인 → 완료 → 다시 열기, 필터와 개수가 따라온다",
    {
      tag: "@delivery",
    },
    async ({ page }) => {
      const inquiry = await submitInquiry(page);
      await signIn(page, "/admin/inquiries");
      await expect(page).toHaveTitle("문의 | Machum Studio 관리자");
      await expect(
        page
          .getByRole("navigation", { name: "관리자 메뉴" })
          .locator("[aria-current=page]"),
      ).toHaveText(/^문의/);

      // 목록: 상태/이메일/메시지 앞부분(한 줄로)/받은 시각. 순서는 다른 테스트가 문의를 넣어 바뀌므로 저장소 계약 테스트에서 본다
      const mine = card(page, inquiry);
      await expect(mine).toContainText("새 문의");
      await expect(mine).toContainText(inquiry.email);
      await expect(mine).toContainText(
        "가족사진 촬영 문의드립니다. - 4명 - 11월 주말",
      );
      await expect(mine.locator("time")).toHaveText(
        /\d{4}\. \d{1,2}\. \d{1,2}\./,
      );
      await expectNewCountsAgree(page);

      // 상세: 제목에 이름이 없고, 열어도 자동으로 확인 처리하지 않는다
      const detailUrl = await openDetail(page, inquiry);
      await expect(page).toHaveTitle("문의 보기 | Machum Studio 관리자");
      await page.reload();
      await expect(statusBadge(page)).toHaveText("새 문의");
      await expect(
        handling(page).getByRole("button", { name: "확인으로 바꾸기" }),
      ).toBeVisible();
      expect(
        await page
          .getByRole("region", { name: "메시지" })
          .locator("p")
          .textContent(),
      ).toBe(inquiry.message);
      await expect(
        page.getByRole("link", { name: /메일로 답장/ }),
      ).toHaveAttribute(
        "href",
        `mailto:${inquiry.email}?subject=${encodeURIComponent("[Machum Studio] 문의 주셔서 감사합니다")}`,
      );
      await expect(page.getByText("남기지 않음")).toBeVisible();

      // 확인 → 완료 → 다시 열기. 지금 상태에서 허용된 버튼 하나만 보인다
      for (const [button, done, next, changedLabel] of [
        [
          "확인으로 바꾸기",
          "‘확인’으로 바꿨습니다.",
          "완료로 바꾸기",
          "확인한 시각",
        ],
        ["완료로 바꾸기", "‘완료’로 바꿨습니다.", "다시 열기", "완료한 시각"],
        [
          "다시 열기",
          "다시 열어 ‘확인’으로 바꿨습니다.",
          "완료로 바꾸기",
          "확인한 시각",
        ],
      ] as const) {
        await handling(page).getByRole("button", { name: button }).click();
        await expect(notice(page)).toHaveText(done);
        await expect(handling(page).getByRole("button")).toHaveText([next]);
        await expect(handling(page).getByText(changedLabel)).toBeVisible();
        // 결과 알림은 주소(?notice=)로 와서, 보여 준 뒤 주소에서 지운다 (docs/adr/0020)
        await expect(page).toHaveURL(detailUrl);
      }
      // 새로 고치면 지난 결과 알림은 다시 나오지 않는다
      await page.reload();
      await expect(statusBadge(page)).toHaveText("확인");
      await expect(notice(page)).toHaveCount(0);

      // 목록: 내 문의는 "확인" 필터에만 있다. 메뉴의 새 문의 수도 같은 화면의 필터와 같다
      await page
        .getByRole("navigation", { name: "관리자 메뉴" })
        .getByRole("link", { name: /^문의/ })
        .click();
      await expect(mine).toContainText("확인");
      await expectNewCountsAgree(page);
      await filterBy(page, /^새 문의/);
      await expect(page).toHaveURL("/admin/inquiries?status=new");
      await expect(mine).toHaveCount(0);
      await filterBy(page, /^확인/);
      await expect(mine).toHaveCount(1);
      await filterBy(page, /^완료/);
      await expect(mine).toHaveCount(0);
      await filterBy(page, /^전체/);
      await expect(mine).toHaveCount(1);
    },
  );

  test("두 탭: 다른 탭이 먼저 바꾼 문의는 친절한 문구와 지금 상태로 다시 보이고, 지운 문의는 목록으로", async ({
    page,
    context,
  }) => {
    const inquiry = await submitInquiry(page);
    await signIn(page, "/admin/inquiries");
    const url = await openDetail(page, inquiry);
    const other = await context.newPage();
    await other.goto(url);

    // 첫 탭이 확인으로 바꾼 뒤, 둘째 탭의 오래된 "확인으로 바꾸기"
    await handling(page)
      .getByRole("button", { name: "확인으로 바꾸기" })
      .click();
    await expect(notice(page)).toHaveText("‘확인’으로 바꿨습니다.");
    await handling(other)
      .getByRole("button", { name: "확인으로 바꾸기" })
      .click();
    await expect(notice(other)).toHaveText(
      /다른 탭이나 기기에서 이 문의의 상태를 먼저 바꿨습니다/,
    );
    await expect(handling(other).getByRole("button")).toHaveText([
      "완료로 바꾸기",
    ]);
    await expect(statusBadge(other)).toHaveText("확인");

    // 첫 탭이 지운 뒤, 둘째 탭이 완료로 바꾸려 하면 목록에서 "찾을 수 없음"
    await page.getByRole("button", { name: "문의 지우기" }).click();
    await page
      .getByRole("dialog", { name: "이 문의를 지울까요?" })
      .getByRole("button", { name: "지우기" })
      .click();
    await expect(page).toHaveURL("/admin/inquiries");
    await handling(other)
      .getByRole("button", { name: "완료로 바꾸기" })
      .click();
    await expect(other).toHaveURL("/admin/inquiries");
    await expect(notice(other)).toHaveText(
      /문의를 찾을 수 없습니다. 다른 탭이나 기기에서 이미 지웠을 수 있습니다/,
    );
  });

  test("지우기: 확인 창에서 취소하면 그대로, 지우면 목록에서 사라지고 상세는 404", async ({
    page,
  }) => {
    const inquiry = await submitInquiry(page);
    await signIn(page, "/admin/inquiries");
    const url = await openDetail(page, inquiry);

    const open = page.getByRole("button", { name: "문의 지우기" });
    const dialog = page.getByRole("dialog", { name: "이 문의를 지울까요?" });
    await open.click();
    await expect(dialog).toContainText(`${inquiry.name} 님의 문의와 연락처`);
    // 처음 포커스는 취소, Esc 로 닫으면 여는 버튼으로 돌아간다
    await expect(dialog.getByRole("button", { name: "취소" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await open.click();
    await dialog.getByRole("button", { name: "지우기" }).click();
    await expect(notice(page)).toHaveText("문의를 지웠습니다.");
    await expect(page).toHaveURL("/admin/inquiries");
    await expect(card(page, inquiry)).toHaveCount(0);

    // 주소로 다시 열면 상태 코드도 404 (proxy 가 있는지 확인, docs/adr/0019). 주소는 그대로다
    expect((await page.goto(url))?.status()).toBe(404);
    await expect(page).toHaveURL(url);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "문의를 찾을 수 없습니다",
    );
    await expect(page).toHaveTitle(
      "문의를 찾을 수 없음 | Machum Studio 관리자",
    );
  });

  test.describe("JS 끈 상태", () => {
    test.use({ javaScriptEnabled: false });

    test("필터와 상태 바꾸기가 일반 링크와 POST 로 된다", async ({ page }) => {
      const inquiry = await submitInquiry(page);
      await signIn(page, "/admin/inquiries?status=new");
      await expect(card(page, inquiry)).toHaveCount(1);
      await card(page, inquiry)
        .getByRole("link", { name: `${inquiry.name} 님의 문의 열기` })
        .click();
      await handling(page)
        .getByRole("button", { name: "확인으로 바꾸기" })
        .click();
      await expect(notice(page)).toHaveText("‘확인’으로 바꿨습니다.");
      await expect(handling(page).getByRole("button")).toHaveText([
        "완료로 바꾸기",
      ]);
      // JS 가 없으면 결과 알림 주소가 그대로 남는다 (redirect 된 화면이 결과를 보여 주는 방식, docs/adr/0016)
      await expect(page).toHaveURL(/\?notice=markRead$/);
    });
  });
});

test("관리자 문의 화면은 로그인이 필요하고 검색에서 빠진다", async ({
  page,
}) => {
  await page.goto("/admin/inquiries?status=done&page=2");
  await expect(page).toHaveURL(
    `/admin/login?next=${encodeURIComponent("/admin/inquiries?status=done&page=2")}`,
  );
  // 로그인 전에는 문의가 있는지 알려 주지 않는다: 없는 문의 주소도 로그인 화면으로
  const missing = "/admin/inquiries/00000000-0000-4000-8000-000000000000";
  await page.goto(missing);
  await expect(page).toHaveURL(
    `/admin/login?next=${encodeURIComponent(missing)}`,
  );
  const response = await page.request.get("/admin/inquiries", {
    maxRedirects: 0,
  });
  expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  await signIn(page, "/admin/inquiries?status=done&page=2");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  // 없는 페이지 번호는 마지막 페이지로 보여 준다
  await expect(
    filters(page).getByRole("link", { name: /^완료/ }),
  ).toHaveAttribute("aria-current", "page");
});

test(
  "모바일/데스크톱: 메뉴와 목록, 상세가 가로로 넘치지 않는다",
  { tag: "@responsive" },
  async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "laptop", "laptop 은 위 흐름에서 본다");
    const inquiry = await submitInquiry(page);
    await signIn(page, "/admin/inquiries");
    const noOverflow = () =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      );
    await expect(menuInquiries(page)).toBeVisible();
    expect(await noOverflow()).toBe(true);
    await openDetail(page, inquiry);
    expect(await noOverflow()).toBe(true);
  },
);
