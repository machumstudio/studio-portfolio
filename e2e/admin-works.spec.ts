import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { PNG } from "pngjs";

// 관리자 작업 관리 (DATA_STORE=memory: 인메모리 작업 저장소 + 인메모리 사진 저장소, 테스트 계정).
// 공개 화면과 같은 서버 메모리를 쓰므로, 공개로 만든 작업은 다른 e2e 와 겹치지 않게 한다:
// - 기본 프로젝트(laptop)에서만 돌고(playwright.config.ts), 실행마다 다른 slug
// - 분야는 이벤트, 촬영 연월은 2001-01: 홈 미리보기(최신 6개), 광고 갤러리 수, 결혼식 상세의 이전/다음에 끼지 않는다
// - 끝에 지운다
const admin = { email: "admin@example.com", password: "memory-admin-password" };

const signIn = async (page: Page, path: string) => {
  await page.goto(path);
  await page.getByLabel("이메일").fill(admin.email);
  await page.getByLabel("비밀번호").fill(admin.password);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(path);
};

const seedPhoto = (name: string) => ({
  name,
  mimeType: "image/jpeg",
  buffer: readFileSync(join("public/images/works", name)),
});

// 긴 변 2400 을 넘는 불투명 PNG (3000×2000). 브라우저가 2400×1600 JPEG 로 줄여야 한다
const bigPng = () => {
  const png = new PNG({ width: 3000, height: 2000 });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = (i / 4) % 256;
    png.data[i + 1] = 120;
    png.data[i + 2] = 200;
    png.data[i + 3] = 255;
  }
  return {
    name: "big.png",
    mimeType: "image/png",
    buffer: PNG.sync.write(png),
  };
};

// EXIF(APP1) 조각을 넣은 JPEG. 다시 인코딩한 파일에는 남지 않아야 한다
const jpegWithExif = () => {
  const jpeg = readFileSync("public/images/works/culinary-delights-2.jpg");
  const payload = Buffer.from(
    "Exif\0\0MM\0*\0\0\0\x08\0\0\0\0\0\0machum-gps-marker",
    "latin1",
  );
  const length = Buffer.alloc(2);
  length.writeUInt16BE(payload.length + 2);
  const app1 = Buffer.concat([Buffer.from([0xff, 0xe1]), length, payload]);
  return {
    name: "with-exif.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.concat([jpeg.subarray(0, 2), app1, jpeg.subarray(2)]),
  };
};

const photoList = (page: Page) =>
  page.getByRole("list", { name: "사진 순서" }).getByRole("listitem");

const photoSrcs = (page: Page) =>
  photoList(page).evaluateAll((items) =>
    items.map((item) => item.getAttribute("data-photo-src")!),
  );

const saveStatus = (page: Page) =>
  page.getByRole("form", { name: "작업 정보" }).getByRole("status").last();

const fillBasics = async (
  page: Page,
  { ko, en, slug }: { ko: string; en: string; slug: string },
) => {
  await page.getByLabel("제목 (한국어)").fill(ko);
  await page.getByLabel("제목 (영어)").fill(en);
  // 새 작업의 주소 이름은 영어 제목을 따라 채워진다
  await expect(page.getByLabel("주소 이름")).toHaveValue(slug);
  await page.getByLabel("분야").selectOption("events");
  await page.getByLabel("촬영 연월").fill("2001-01");
};

const save = (page: Page) =>
  page.getByRole("button", { name: "저장", exact: true }).click();

// 같은 주소로 다시 오면 이전 화면이 숨은 채 남아 있을 수 있어 보이는 main 안에서 찾는다
// sitemap.xml 에 이 작업의 ko/en 주소가 있는지. 저장 액션의 updateTag("works") 로 sitemap 도 다시 만들어진다
const sitemapLists = async (page: Page, slug: string) => {
  const xml = await (await page.request.get("/sitemap.xml")).text();
  const ko = xml.includes(
    `<loc>${new URL(`/work/${slug}`, page.url()).href}</loc>`,
  );
  const en = xml.includes(`/en/work/${slug}</loc>`);
  expect(ko, "ko 와 en 이 같이 있거나 같이 없다").toBe(en);
  return ko;
};

const gallery = (page: Page) => page.getByRole("main").locator("#works");

const eventsCard = (page: Page, title: string) =>
  gallery(page).getByRole("link", {
    name: new RegExp(`^프로젝트 보기.*${title}`),
  });

// 납품 확인용 흐름 ② (pnpm test:delivery): "비개발자 관리자". 로그인해서 사진과 함께 작업을 올리고 공개하면
// 포트폴리오, 작업 상세, sitemap 에 보이고, 비공개/지우기도 공개 화면에 바로 반영된다
test(
  "납품 확인 ② 관리자 로그인 → 작업 등록(사진 여러 장, 순서 변경, 대표 지정) → 공개하면 /portfolio, 상세, sitemap 에 보이고, 비공개면 사라지고, 지우면 상세가 404",
  {
    tag: "@delivery",
  },
  async ({ page }) => {
    test.setTimeout(120_000);
    const run = Date.now().toString(36);
    const work = {
      ko: `이벤트 기록 ${run}`,
      en: `Event Record ${run}`,
      slug: `event-record-${run}`,
    };

    await signIn(page, "/admin");
    await page.getByRole("link", { name: "새 작업 만들기" }).click();
    await expect(page).toHaveURL("/admin/works/new");
    await fillBasics(page, work);

    // 여러 장을 한 번에 고른다 (드래그 앤 드롭과 같은 경로로 들어간다)
    await page
      .locator('input[type="file"]')
      .setInputFiles([
        seedPhoto("festival-of-colors-1.jpg"),
        seedPhoto("festival-of-colors-2.jpg"),
        bigPng(),
        jpegWithExif(),
      ]);
    await expect(photoList(page)).toHaveCount(4, { timeout: 60_000 });
    const uploaded = await photoSrcs(page);
    expect(uploaded.every((src) => src.startsWith("/media/work-photos/"))).toBe(
      true,
    );

    // 브라우저에서 긴 변 2400 으로 줄이고 JPEG 로 다시 인코딩했다
    const big = await page.request.get(uploaded[2]!);
    expect(big.headers()["content-type"]).toBe("image/jpeg");
    expect(
      await page.evaluate(
        (src) =>
          new Promise<number[]>((resolve) => {
            const image = new Image();
            image.onload = () =>
              resolve([image.naturalWidth, image.naturalHeight]);
            image.src = src;
          }),
        uploaded[2]!,
      ),
    ).toEqual([2400, 1600]);
    // EXIF 가 남지 않는다
    const exif = await (await page.request.get(uploaded[3]!)).body();
    expect(exif.includes("Exif")).toBe(false);
    expect(exif.includes("machum-gps-marker")).toBe(false);

    // 첫 사진이 대표. 두 번째 사진을 끌어서 맨 앞으로
    await expect(
      page.getByRole("button", { name: "사진 1 대표로 지정" }),
    ).toHaveAttribute("aria-pressed", "true");
    await photoList(page)
      .nth(1)
      .locator("img")
      .dragTo(photoList(page).nth(0).locator("img"));
    const reordered = [uploaded[1], uploaded[0], uploaded[2], uploaded[3]];
    await expect.poll(() => photoSrcs(page)).toEqual(reordered);
    // 대표는 사진을 따라간다 (이제 2번째). 네 번째 사진(EXIF 를 지운 사진)을 대표로
    await expect(
      page.getByRole("button", { name: "사진 2 대표로 지정" }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "사진 4 대표로 지정" }).click();
    const cover = uploaded[3]!;

    await page.getByLabel("공개하기").check();
    await save(page);
    await expect(page).toHaveURL(/\/admin\/works\/[0-9a-f-]{36}$/);
    await expect(saveStatus(page)).toHaveText("작업을 만들었습니다.");
    const editUrl = new URL(page.url()).pathname;
    // 저장한 순서와 대표가 그대로 다시 그려진다
    expect(await photoSrcs(page)).toEqual(reordered);
    await expect(
      page.getByRole("button", { name: "사진 4 대표로 지정" }),
    ).toHaveAttribute("aria-pressed", "true");

    // 공개: 포트폴리오(이벤트)에 대표 사진으로 보이고, 상세에 사진 4장
    await page.goto("/portfolio?category=events");
    await expect(eventsCard(page, work.ko)).toBeVisible();
    await expect(
      gallery(page).locator(`img[src*="${encodeURIComponent(cover)}"]`),
    ).toHaveCount(1);
    await page.goto(`/work/${work.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(work.ko);
    await expect(
      page
        .getByRole("article", { name: work.ko })
        .getByRole("region", { name: "사진 4장" })
        .getByRole("button"),
    ).toHaveCount(4);
    expect(await sitemapLists(page, work.slug)).toBe(true);

    // 목록에 공개로 보인다
    await page.goto("/admin");
    const row = page
      .getByRole("list", { name: "작업 목록" })
      .getByRole("listitem")
      .filter({ hasText: work.ko });
    await expect(row).toContainText("공개2001년 1월·사진 4장");

    // 비공개로 바꾸면 공개 화면에서 사라진다
    await page.goto(editUrl);
    await page.getByLabel("공개하기").uncheck();
    await save(page);
    await expect(saveStatus(page)).toHaveText("저장했습니다.");
    await page.goto("/portfolio?category=events");
    await expect(gallery(page)).toBeVisible();
    await expect(eventsCard(page, work.ko)).toHaveCount(0);
    expect((await page.goto(`/work/${work.slug}`))?.status()).toBe(404);
    expect(await sitemapLists(page, work.slug)).toBe(false);

    // 다시 공개한 뒤 지우면 상세가 404, 사진 파일도 지워진다
    await page.goto(editUrl);
    await page.getByLabel("공개하기").check();
    await save(page);
    await expect(saveStatus(page)).toHaveText("저장했습니다.");
    expect((await page.goto(`/work/${work.slug}`))?.status()).toBe(200);

    await page.goto(editUrl);
    await page.getByRole("button", { name: "작업 지우기" }).click();
    const dialog = page.getByRole("dialog", { name: "이 작업을 지울까요?" });
    await expect(dialog).toContainText(
      `‘${work.ko}’ 작업과 사진 4장을 지웁니다.`,
    );
    await dialog.getByRole("button", { name: "지우기" }).click();
    await expect(page).toHaveURL("/admin");
    await expect(page.getByRole("status").first()).toHaveText(
      "작업을 지웠습니다.",
    );
    expect((await page.goto(`/work/${work.slug}`))?.status()).toBe(404);
    expect(await sitemapLists(page, work.slug)).toBe(false);
    // 지운 작업의 편집 주소도 상태 코드 404 (proxy 가 있는지 확인, docs/adr/0019)
    expect((await page.goto(editUrl))?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "작업을 찾을 수 없습니다",
    );
    await expect(page).toHaveTitle(
      "작업을 찾을 수 없음 | Machum Studio 관리자",
    );
    for (const src of uploaded)
      expect((await page.request.get(src)).status(), src).toBe(404);
  },
);

test(
  "키보드만으로 사진 순서를 바꾸고 대표를 지정한다 (스크린리더 안내 포함)",
  { tag: "@responsive" },
  async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile",
      "작은 화면에서 버튼으로 (터치 기기는 끌어서 놓기를 못 쓴다)",
    );
    test.setTimeout(90_000);
    const run = Date.now().toString(36);
    const work = {
      ko: `키보드 작업 ${run}`,
      en: `Keyboard Work ${run}`,
      slug: `keyboard-work-${run}`,
    };

    await signIn(page, "/admin/works/new");
    await fillBasics(page, work);
    await page
      .locator('input[type="file"]')
      .setInputFiles([
        seedPhoto("a-wedding-tale-1.jpg"),
        seedPhoto("a-wedding-tale-2.jpg"),
        seedPhoto("a-wedding-tale-3.jpg"),
      ]);
    await expect(photoList(page)).toHaveCount(3, { timeout: 60_000 });
    const [a, b, c] = await photoSrcs(page);

    const announce = page.locator("section").getByRole("status");
    await page.getByRole("button", { name: "사진 1 뒤로" }).focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => photoSrcs(page)).toEqual([b, a, c]);
    await expect(announce).toHaveText("사진을 2번째로 옮겼습니다.");
    // 포커스는 옮긴 사진의 같은 버튼에 남아 한 번 더 누를 수 있다
    await expect(
      page.getByRole("button", { name: "사진 2 뒤로" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect.poll(() => photoSrcs(page)).toEqual([b, c, a]);
    // 끝에서는 막히지만 포커스를 잃지 않는다
    const last = page.getByRole("button", { name: "사진 3 뒤로" });
    await expect(last).toBeFocused();
    await expect(last).toHaveAttribute("aria-disabled", "true");

    // Shift+Tab 으로 같은 사진의 앞으로/대표 지정 버튼으로 돌아간다. 대표(처음 첫 사진)는 사진을 따라왔다
    await page.keyboard.press("Shift+Tab");
    await expect(
      page.getByRole("button", { name: "사진 3 앞으로" }),
    ).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    const coverOf3 = page.getByRole("button", { name: "사진 3 대표로 지정" });
    await expect(coverOf3).toBeFocused();
    await expect(coverOf3).toHaveAttribute("aria-pressed", "true");

    // 첫 사진을 대표로 (Space)
    const coverOf1 = page.getByRole("button", { name: "사진 1 대표로 지정" });
    await coverOf1.focus();
    await page.keyboard.press("Space");
    await expect(coverOf1).toHaveAttribute("aria-pressed", "true");
    await expect(coverOf3).toHaveAttribute("aria-pressed", "false");
    await expect(announce).toHaveText(
      "1번째 사진을 대표 사진으로 지정했습니다.",
    );

    await page.getByRole("button", { name: "저장", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/admin\/works\/[0-9a-f-]{36}$/);
    await page.reload();
    expect(await photoSrcs(page)).toEqual([b, c, a]);
    await expect(
      page.getByRole("button", { name: "사진 1 대표로 지정" }),
    ).toHaveAttribute("aria-pressed", "true");

    // 지우기 확인도 키보드로: 처음 포커스는 취소, Tab 으로 지우기
    await page.getByRole("button", { name: "작업 지우기" }).focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "이 작업을 지울까요?" });
    await expect(dialog.getByRole("button", { name: "취소" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("button", { name: "지우기" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/admin");
  },
);

test("사진 저장소 입구: 모르는 업로드 주소는 404, 관리자 화면은 로그인이 필요하다", async ({
  page,
}) => {
  const put = await page.request.put(
    "/admin/uploads/00000000-0000-4000-8000-000000000000",
    { headers: { "content-type": "image/jpeg" }, data: Buffer.from([1, 2]) },
  );
  expect(put.status()).toBe(404);
  expect(
    (await page.request.get("/media/work-photos/work-01/nope.jpg")).status(),
  ).toBe(404);
  await page.goto("/admin/works/new");
  await expect(page).toHaveURL("/admin/login?next=%2Fadmin%2Fworks%2Fnew");
});
