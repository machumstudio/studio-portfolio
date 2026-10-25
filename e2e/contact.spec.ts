import { expect, test, type Page } from "@playwright/test";

// /contact: 메타데이터, 헤더 현재 페이지, 문의 폼(정상 제출, 빈 제출, JS 끈 제출, ko/en)
const fillValid = async (page: Page) => {
  await page.getByLabel("이름", { exact: true }).fill("하늘");
  await page.getByLabel("성", { exact: true }).fill("김");
  await page.getByLabel("이메일", { exact: true }).fill("sky@example.com");
  await page.getByLabel("메시지", { exact: true }).fill("가족사진 촬영 문의");
};

const send = (page: Page) =>
  page.getByRole("button", { name: "메시지 보내기" }).click();

test("제목과 설명 메타데이터, h1", async ({ page }) => {
  await page.goto("/contact");
  await expect(page).toHaveTitle("문의하기 | Machum Studio");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /하루 안에 답장/,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "함께 이야기해요",
  );
});

test(
  "헤더: 데스크톱은 문의하기 버튼만 현재 페이지",
  { tag: "@responsive" },
  async ({ page }, info) => {
    test.skip(info.project.name === "mobile", "데스크톱 메뉴는 lg 부터");
    await page.goto("/contact");
    await expect(
      page.getByRole("banner").locator("[aria-current=page]:visible"),
    ).toHaveText(["문의하기"]);
  },
);

test(
  "헤더: 모바일 메뉴도 문의하기만 현재 페이지",
  { tag: "@responsive" },
  async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "모바일 메뉴는 lg 미만");
    await page.goto("/contact");
    await page.getByRole("button", { name: "메뉴 열기" }).click();
    const nav = page.getByRole("navigation", { name: "주요 메뉴" });
    await expect(nav.locator("[aria-current]")).toHaveText(["문의하기"]);
  },
);

test("연락처 정보와 후기가 함께 있다", async ({ page }) => {
  await page.goto("/contact");
  await expect(
    page.getByRole("link", { name: "이메일: hello@example.com" }),
  ).toHaveAttribute("href", "mailto:hello@example.com");
  await expect(page.locator("#testimonials")).toBeVisible();
});

test("정상 제출 → 성공 알림, 칸은 비워진다", async ({ page }) => {
  await page.goto("/contact");
  await fillValid(page);
  await send(page);
  await expect(page.getByRole("status")).toHaveText(/메시지를 보냈습니다/);
  await expect(page.getByLabel("이름", { exact: true })).toHaveValue("");
  await expect(page).toHaveURL(/\/contact$/);
});

test("빈 제출 → 필수 칸 오류 전부 + 첫 칸 포커스", async ({ page }) => {
  await page.goto("/contact");
  await send(page);
  const form = page.getByRole("form", { name: "문의 양식" });
  await expect(form.locator("[aria-invalid=true]")).toHaveCount(4);
  for (const [label, error] of [
    ["이름", "이름을 입력해 주세요."],
    ["성", "성을 입력해 주세요."],
    ["이메일", "이메일을 입력해 주세요."],
    ["메시지", "메시지를 입력해 주세요."],
  ])
    await expect(
      page.getByLabel(label, { exact: true }),
    ).toHaveAccessibleDescription(error);
  await expect(page.getByLabel("연락처 (선택)")).not.toHaveAttribute(
    "aria-invalid",
  );
  await expect(page.getByLabel("이름", { exact: true })).toBeFocused();
  await expect(page.getByRole("status")).toHaveText(/고칠 칸이 4개/);
});

test("틀린 칸만 표시하고 입력값은 남는다", async ({ page }) => {
  await page.goto("/contact");
  await fillValid(page);
  await page.getByLabel("이메일", { exact: true }).fill("sky@");
  await page.getByLabel("연락처 (선택)").fill("12");
  await send(page);
  await expect(page.getByLabel("이메일", { exact: true })).toBeFocused();
  await expect(page.getByLabel("이메일", { exact: true })).toHaveValue("sky@");
  await expect(page.getByLabel("연락처 (선택)")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByLabel("이름", { exact: true })).toHaveValue("하늘");
  await expect(
    page
      .getByRole("form", { name: "문의 양식" })
      .locator("[aria-invalid=true]"),
  ).toHaveCount(2);
});

test.describe("JS 끈 상태", () => {
  test.use({ javaScriptEnabled: false });

  test("빈 제출도 서버 검증 결과가 그려지고 첫 오류 칸에 포커스", async ({
    page,
  }) => {
    await page.goto("/contact");
    await page.getByLabel("이름", { exact: true }).fill("하늘");
    await send(page);
    await expect(page.getByLabel("성", { exact: true })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(
      page
        .getByRole("form", { name: "문의 양식" })
        .locator("[aria-invalid=true]"),
    ).toHaveCount(3);
    await expect(page.getByLabel("이름", { exact: true })).toHaveValue("하늘");
    await expect(page.getByLabel("성", { exact: true })).toBeFocused();
    await expect(page.getByRole("status")).toHaveText(/고칠 칸이 3개/);
  });

  test("정상 제출도 성공 알림", async ({ page }) => {
    await page.goto("/contact");
    await fillValid(page);
    await send(page);
    await expect(page.getByRole("status")).toHaveText(/메시지를 보냈습니다/);
  });
});

test("en: 같은 폼이 영어 문구로 동작한다", async ({ page }) => {
  await page.goto("/en/contact");
  await expect(page).toHaveTitle("Contact | Machum Studio");
  await page.getByRole("button", { name: "Send Message" }).click();
  await expect(page.getByLabel("First Name")).toHaveAccessibleDescription(
    "Please enter your first name.",
  );
  await expect(page.getByRole("status")).toHaveText(
    "Please check your entries. 4 fields need attention.",
  );
  await page.getByLabel("First Name").fill("Sky");
  await page.getByLabel("Last Name").fill("Kim");
  await page.getByLabel("Email", { exact: true }).fill("sky@example.com");
  await page.getByLabel("Your Message").fill("Hello");
  await page.getByRole("button", { name: "Send Message" }).click();
  await expect(page.getByRole("status")).toHaveText(
    /Your message has been sent/,
  );
});
