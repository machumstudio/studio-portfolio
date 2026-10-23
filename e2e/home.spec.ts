import { expect, type Page, test } from "@playwright/test";

// 홈 Hero, About: 실제 CSS 로만 확인되는 배치 (콜라주 칸이 화면 안에 있는지, 태블릿 폭)
test("이름이 h1, 히어로 CTA 는 문의 페이지로 간다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Machum Studio",
  );
  const hero = page.getByRole("region", { name: "Machum Studio" });
  await expect(hero.getByRole("link", { name: "문의하기" })).toHaveAttribute(
    "href",
    "/contact",
  );
});

test("콜라주 7칸은 모두 콘텐츠 폭 안에 있다 (태블릿 768 포함)", async ({
  page,
}) => {
  for (const width of [page.viewportSize()!.width, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const tiles = page
      .getByRole("region", { name: "Machum Studio" })
      .locator("[data-visual-mask]");
    await expect(tiles).toHaveCount(7);
    for (const box of await tiles.evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().toJSON()),
    )) {
      expect(box.width).toBeGreaterThan(0);
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(width);
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    );
    expect(overflow).toBe(0);
  }
});

test("About: 소개서 내려받기는 준비 중이라 Tab 으로 건너뛴다", async ({
  page,
}) => {
  await page.goto("/");
  const about = page.getByRole("region", { name: "마춤 스튜디오입니다" });
  const work = about.getByRole("link", { name: "함께 작업하기" });
  await expect(work).toHaveAttribute("href", "/contact");
  await expect(
    about.getByRole("button", { name: /소개서 내려받기/ }),
  ).toBeDisabled();
  // 함께 작업하기 다음 Tab 은 About 밖(다음 섹션 Services)으로 나간다
  await work.focus();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () =>
        !!document.activeElement?.closest('[aria-labelledby="services-title"]'),
    ),
  ).toBe(true);
});

test("About: 소셜 버튼과 아래 버튼 높이는 시안과 같다 (40/40/48, 49/49/63)", async ({
  page,
}, testInfo) => {
  const desktop = testInfo.project.name === "desktop";
  await page.goto("/");
  const about = page.getByRole("region", { name: "마춤 스튜디오입니다" });
  const height = (role: "link" | "button", name: RegExp) =>
    about
      .getByRole(role, { name })
      .evaluate((el) => el.getBoundingClientRect().height);
  expect(await height("link", /^Instagram/)).toBe(desktop ? 48 : 40);
  expect(await height("link", /함께 작업하기/)).toBe(desktop ? 63 : 49);
  expect(await height("button", /소개서 내려받기/)).toBe(desktop ? 63 : 49);
});

// Services / Portfolio 슬라이더: 실제 스크롤, scroll-snap, 한 화면 장수는 브라우저에서만 확인된다
const track = (page: Page, id: string) => page.locator(`#${id}-title-track`);
const slideWidth = (page: Page, id: string) =>
  track(page, id).evaluate(
    (el) => (el.firstElementChild as HTMLElement).getBoundingClientRect().width,
  );
const expectScrolledTo = (page: Page, id: string, target: number) =>
  expect
    .poll(async () =>
      Math.abs(
        (await track(page, id).evaluate((el) => el.scrollLeft)) - target,
      ),
    )
    .toBeLessThanOrEqual(1);
// 트랙 안에서 지금 보이는(가로로 트랙 안에 들어온) 슬라이드의 라벨
const visibleSlides = (page: Page, id: string) =>
  track(page, id).evaluate((el) => {
    const box = el.getBoundingClientRect();
    return [...el.children]
      .filter((slide) => {
        const r = slide.getBoundingClientRect();
        return r.left >= box.left - 1 && r.right <= box.right + 1;
      })
      .map((slide) => slide.getAttribute("aria-label"));
  });
// 가로로 보이는 서비스 슬라이드의 이름 (mobile 은 슬라이드가 화면보다 길어 세로 위치는 보지 않는다)
const visibleServices = (page: Page) =>
  track(page, "services").evaluate((el) => {
    const box = el.getBoundingClientRect();
    return [...el.children]
      .filter((slide) => {
        const r = slide.getBoundingClientRect();
        return r.left >= box.left - 1 && r.right <= box.right + 1;
      })
      .map((slide) => slide.querySelector("h3")?.textContent);
  });

test.describe("Services 슬라이더", () => {
  const services = (page: Page) =>
    page.getByRole("region", { name: "촬영 서비스" });

  test("한 번에 서비스 하나, 다음/이전 화살표로 이벤트 → 인물 → 광고를 오간다", async ({
    page,
  }) => {
    await page.goto("/");
    const previous = services(page).getByRole("button", {
      name: "이전 서비스",
    });
    const next = services(page).getByRole("button", { name: "다음 서비스" });
    await next.scrollIntoViewIfNeeded();
    const width = await slideWidth(page, "services");
    expect(await visibleSlides(page, "services")).toEqual(["1 / 3"]);
    expect(await visibleServices(page)).toEqual(["이벤트"]);
    await expect(previous).toHaveAttribute("aria-disabled", "true");

    await next.click();
    await expectScrolledTo(page, "services", width);
    expect(await visibleServices(page)).toEqual(["인물"]);
    await next.click();
    await expectScrolledTo(page, "services", width * 2);
    expect(await visibleServices(page)).toEqual(["광고"]);
    await expect(next).toHaveAttribute("aria-disabled", "true");

    await previous.click();
    await expectScrolledTo(page, "services", width);
    await expect(next).toHaveAttribute("aria-disabled", "false");
  });

  test("키보드: 화살표 버튼에서 Enter/Space 로 넘기고, Tab 은 모두 보기로 간다", async ({
    page,
  }) => {
    await page.goto("/");
    const next = services(page).getByRole("button", { name: "다음 서비스" });
    const width = await slideWidth(page, "services");
    await next.focus();
    await page.keyboard.press("Enter");
    await expectScrolledTo(page, "services", width);
    await page.keyboard.press("Space");
    await expectScrolledTo(page, "services", width * 2);
    await page.keyboard.press("Tab");
    await expect(
      services(page).getByRole("link", { name: "모든 서비스 보기" }),
    ).toBeFocused();
  });

  test("가로 스크롤(스와이프)은 서비스 한 장 단위로 맞춰 멈춘다", async ({
    page,
  }) => {
    await page.goto("/");
    await track(page, "services").scrollIntoViewIfNeeded();
    const width = await slideWidth(page, "services");
    const box = (await track(page, "services").boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + 100);
    await page.mouse.wheel(Math.round(width * 0.7), 0);
    await expectScrolledTo(page, "services", width);
    await expect(
      services(page).getByRole("button", { name: "이전 서비스" }),
    ).toHaveAttribute("aria-disabled", "false");
  });
});

test.describe("Portfolio 미리보기", () => {
  const portfolio = (page: Page) =>
    page.getByRole("region", { name: "작업을 둘러보세요" });
  // 인메모리 시드의 공개 작업 9개 (비공개 1개 제외), 최신순
  const total = 9;
  const labels = (from: number, count: number) =>
    Array.from({ length: count }, (_, i) => `${from + i} / ${total}`);

  test("공개 작업이 최신순 카드로 나오고, 링크는 /work/[slug], 한 화면에 mobile 1 / lg 3 장", async ({
    page,
  }, testInfo) => {
    await page.goto("/");
    const links = portfolio(page).getByRole("link", { name: /^프로젝트 보기/ });
    await expect(links).toHaveCount(total);
    expect(
      (
        await links.evaluateAll((els) => els.map((a) => a.getAttribute("href")))
      ).slice(0, 3),
    ).toEqual([
      "/work/faces-of-resilience",
      "/work/a-wedding-tale",
      "/work/product-elegance",
    ]);
    await expect(
      portfolio(page).getByRole("link", { name: /촬영 현장 기록/ }),
    ).toHaveCount(0);
    await track(page, "portfolio").scrollIntoViewIfNeeded();
    const perView = testInfo.project.name === "mobile" ? 1 : 3;
    expect(await visibleSlides(page, "portfolio")).toEqual(labels(1, perView));
    await expect(
      portfolio(page).getByRole("button", { name: "이전 작업" }),
    ).toHaveAttribute("aria-disabled", "true");
    await expect(
      portfolio(page).getByRole("button", { name: "다음 작업" }),
    ).toHaveAttribute("aria-disabled", "false");
  });

  test("다음 화살표로 한 장씩 넘기고, 끝에 닿으면 다음 화살표가 꺼진다", async ({
    page,
  }, testInfo) => {
    await page.goto("/");
    const next = portfolio(page).getByRole("button", { name: "다음 작업" });
    const previous = portfolio(page).getByRole("button", { name: "이전 작업" });
    await next.scrollIntoViewIfNeeded();
    const width = await slideWidth(page, "portfolio");
    const perView = testInfo.project.name === "mobile" ? 1 : 3;

    await next.click();
    await expectScrolledTo(page, "portfolio", width);
    expect(await visibleSlides(page, "portfolio")).toEqual(labels(2, perView));
    await expect(previous).toHaveAttribute("aria-disabled", "false");

    for (let step = 2; step <= total - perView; step++) {
      await next.click();
      await expectScrolledTo(page, "portfolio", width * step);
    }
    expect(await visibleSlides(page, "portfolio")).toEqual(
      labels(total - perView + 1, perView),
    );
    await expect(next).toHaveAttribute("aria-disabled", "true");
  });

  test("mobile: 스와이프로 카드를 한 장씩 넘긴다", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "lg 는 화살표 테스트로 충분");
    await page.goto("/");
    await track(page, "portfolio").scrollIntoViewIfNeeded();
    const width = await slideWidth(page, "portfolio");
    const box = (await track(page, "portfolio").boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + 100);
    await page.mouse.wheel(Math.round(width * 0.7), 0);
    await expectScrolledTo(page, "portfolio", width);
    expect(await visibleSlides(page, "portfolio")).toEqual(labels(2, 1));
  });
});
