import { expect, type Page, test } from "@playwright/test";

// FAQ 아코디언과 후기 슬라이더를 실제 브라우저(CSS, 스크롤, scroll-snap)로 확인한다
const faq = (page: Page) =>
  page.getByRole("region", { name: "궁금한 점을 모았어요" });

test.describe("FAQ 아코디언", () => {
  test("질문을 눌러 열고 다시 눌러 닫는다", async ({ page }) => {
    await page.goto("/");
    const question = faq(page).getByRole("button", {
      name: "촬영 예약은 어떻게 하나요?",
    });
    const answer = page.getByRole("region", {
      name: "촬영 예약은 어떻게 하나요?",
    });
    await question.scrollIntoViewIfNeeded();
    await expect(question).toHaveAttribute("aria-expanded", "false");
    await expect(answer).toBeHidden();

    await question.click();
    await expect(question).toHaveAttribute("aria-expanded", "true");
    await expect(answer).toBeVisible();
    await expect(answer).toContainText("문의하기 페이지에서");

    await question.click();
    await expect(question).toHaveAttribute("aria-expanded", "false");
    // 높이가 0 으로 접힌다 (전환이 끝날 때까지 기다림)
    await expect
      .poll(() => answer.evaluate((el) => el.getBoundingClientRect().height))
      .toBe(0);
  });

  test("키보드: 아래 화살표로 다음 질문, Enter 로 열기, End 로 마지막", async ({
    page,
  }) => {
    await page.goto("/");
    const buttons = faq(page).locator("[data-accordion-header]");
    await buttons.first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(buttons.nth(1)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(buttons.nth(1)).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("End");
    await expect(buttons.last()).toBeFocused();
  });

  test("열림 전환은 reduced-motion 이면 꺼진다", async ({ page }) => {
    const duration = () =>
      faq(page)
        .getByRole("region")
        .first()
        .evaluate((el) => getComputedStyle(el).transitionDuration);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    expect(await duration()).toBe("0.25s");
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await duration()).toBe("0s");
  });
});

test.describe("후기 슬라이더", () => {
  const carousel = (page: Page) =>
    page.getByRole("region", { name: "고객이 전하는 이야기" });
  const track = (page: Page) => page.locator("#testimonials-title-track");
  const scrollLeft = (page: Page) =>
    track(page).evaluate((el) => el.scrollLeft);
  const slideWidth = (page: Page) =>
    track(page).evaluate(
      (el) =>
        (el.firstElementChild as HTMLElement).getBoundingClientRect().width,
    );

  // 슬라이드 폭이 소수(1/3)라 1px 안쪽이면 같은 위치로 본다
  const expectScrolledTo = (page: Page, target: number) =>
    expect
      .poll(async () => Math.abs((await scrollLeft(page)) - target))
      .toBeLessThanOrEqual(1);

  test(
    "다음/이전 화살표로 한 장씩 움직이고, 끝에서 다음이 꺼진다",
    { tag: "@responsive" },
    async ({ page }) => {
      await page.goto("/");
      const previous = carousel(page).getByRole("button", {
        name: "이전 후기",
      });
      const next = carousel(page).getByRole("button", { name: "다음 후기" });
      await next.scrollIntoViewIfNeeded();
      await expect(previous).toHaveAttribute("aria-disabled", "true");
      const width = await slideWidth(page);

      await next.click();
      await expectScrolledTo(page, width);
      await expect(previous).toHaveAttribute("aria-disabled", "false");

      await previous.click();
      await expectScrolledTo(page, 0);

      // 6장 중 한 화면에 보이는 수만큼 남을 때까지 넘기면 다음이 꺼진다
      const perView = Math.round(
        (await track(page).evaluate((el) => el.clientWidth)) / width,
      );
      for (let i = 0; i < 6 - perView; i++) {
        await next.click();
        await expectScrolledTo(page, width * (i + 1));
      }
      await expect(next).toHaveAttribute("aria-disabled", "true");
    },
  );

  test("가로 스크롤(스와이프)은 slide 단위로 맞춰 멈춘다 (scroll-snap)", async ({
    page,
  }) => {
    await page.goto("/");
    await track(page).scrollIntoViewIfNeeded();
    const width = await slideWidth(page);
    const box = (await track(page).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(Math.round(width * 0.7), 0);
    await expectScrolledTo(page, width);
  });

  test("슬라이드마다 'n / 전체' 라벨이 붙는다", async ({ page }) => {
    await page.goto("/");
    const slides = carousel(page).getByRole("group");
    await expect(slides).toHaveCount(6);
    await expect(slides.first()).toHaveAttribute("aria-label", "1 / 6");
    await expect(slides.last()).toHaveAttribute("aria-label", "6 / 6");
  });
});
