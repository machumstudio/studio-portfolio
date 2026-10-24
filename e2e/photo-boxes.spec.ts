import { expect, test, type Page } from "@playwright/test";
import { PNG } from "pngjs";

// 관리자 업로드(18칸)로 비율/크기가 제각각인 사진이 와도 사진 칸(고정 상자 + object-cover)이 그대로인지 본다.
// 모든 사진 요청(/_next/image, /images/*)을 아주 세로로 긴(1:4), 아주 가로로 긴(4:1), 작은(200px) 사진으로 바꿔
// 기본 사진일 때와 사진 상자 크기/위치, 문서 높이가 같고 가로 넘침이 없는지 비교한다.
const pages = [
  "/",
  "/portfolio",
  "/about",
  "/services",
  "/contact",
  "/work/a-wedding-tale",
];

const fixtures = [
  { name: "1:4", width: 400, height: 1600 },
  { name: "4:1", width: 1600, height: 400 },
  { name: "200px", width: 200, height: 200 },
] as const;

// 줄무늬 사진 (단색이면 잘려도 티가 안 난다)
const png = (width: number, height: number) => {
  const image = new PNG({ width, height });
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const on = Math.floor((x + y) / 40) % 2 === 0;
      image.data[i] = on ? 200 : 60;
      image.data[i + 1] = on ? 160 : 60;
      image.data[i + 2] = on ? 40 : 60;
      image.data[i + 3] = 255;
    }
  return PNG.sync.write(image);
};

const servePhoto = async (page: Page, body: Buffer) => {
  await page.route(/\/_next\/image\?|\/images\//, (route) =>
    route.fulfill({ contentType: "image/png", body }),
  );
};

// 사진(next/image fill)이 들어가는 상자 = img 의 부모. 숨은 슬라이드는 0 x 0 으로 같이 비교된다
const measure = (page: Page) =>
  page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth - innerWidth,
    height: document.documentElement.scrollHeight,
    boxes: [...document.querySelectorAll("img")].map((img) => {
      const box = img.parentElement!.getBoundingClientRect();
      const own = img.getBoundingClientRect();
      return {
        box: [box.x + scrollX, box.y + scrollY, box.width, box.height].map(
          Math.round,
        ),
        // 사진이 상자를 넘지 않는다 (fill 이라 같은 크기)
        inside: own.width <= box.width + 0.5 && own.height <= box.height + 0.5,
        fit: getComputedStyle(img).objectFit,
      };
    }),
  }));

// 사진이 실제로 바뀌었는지: 보이는 첫 사진의 비율이 바꾼 사진 비율인지 본다.
// naturalWidth 는 srcset 의 밀도로 나눈 값이라 크기 대신 비율을 본다 (기본 사진은 2:3, 3:2 라 겹치지 않는다)
const firstLoadedRatio = (page: Page) =>
  page.waitForFunction(() => {
    const img = [...document.querySelectorAll("img")].find((el) =>
      el.checkVisibility(),
    );
    return img?.complete && img.naturalWidth > 0
      ? img.naturalWidth / img.naturalHeight
      : false;
  });

// 스트리밍으로 늦게 오는 목록(Portfolio 갤러리)까지 그려진 뒤에 잰다
const visit = (page: Page, path: string) =>
  page.goto(path, { waitUntil: "networkidle" });

const check = async (page: Page, path: string) => {
  await visit(page, path);
  const base = await measure(page);
  expect(base.boxes.length, `${path} 사진 칸`).toBeGreaterThan(0);

  for (const { name, width, height } of fixtures) {
    await servePhoto(page, png(width, height));
    await visit(page, path);
    expect(
      await (await firstLoadedRatio(page)).jsonValue(),
      `${path} ${name}`,
    ).toBeCloseTo(width / height, 1);
    const odd = await measure(page);
    expect(odd.scrollWidth, `${path} ${name} 가로 넘침`).toBe(0);
    expect(odd.height, `${path} ${name} 문서 높이`).toBe(base.height);
    expect(odd.boxes, `${path} ${name} 사진 칸`).toEqual(base.boxes);
    for (const { inside, fit } of odd.boxes) {
      expect(inside).toBe(true);
      expect(fit).toBe("cover");
    }
    await page.unrouteAll();
  }
};

for (const path of pages)
  test(`사진 칸: ${path} 는 어떤 비율의 사진이 와도 그대로다`, async ({
    page,
  }) => {
    await check(page, path);
  });

test("사진 칸: 태블릿 768 에서도 그대로다", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "mobile",
    "뷰포트를 직접 바꾸므로 한 번만",
  );
  await page.setViewportSize({ width: 768, height: 1024 });
  for (const path of pages) await check(page, path);
});

// Lightbox 는 사진 전체를 보여 주려고 object-contain 이다. 상자(화면 - 위/아래 줄)와 버튼 위치가 사진과 상관없이 같아야 한다
test("사진 칸: Lightbox 상자와 버튼은 사진 비율과 상관없이 같은 자리다", async ({
  page,
}) => {
  const open = async () => {
    await visit(page, "/work/a-wedding-tale");
    await page.getByRole("button", { name: /^사진 1 크게 보기/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    return dialog.evaluate((el) => {
      const img = el.querySelector("img")!;
      const rect = (node: Element) =>
        [...Object.values(node.getBoundingClientRect().toJSON())]
          .slice(0, 4)
          .map((v) => Math.round(v as number));
      return {
        box: rect(img.parentElement!),
        buttons: [...el.querySelectorAll("button")].map(rect),
        fit: getComputedStyle(img).objectFit,
      };
    });
  };
  const base = await open();
  for (const { width, height } of fixtures) {
    await servePhoto(page, png(width, height));
    expect(await open()).toEqual({ ...base, fit: "contain" });
    await page.unrouteAll();
  }
});
