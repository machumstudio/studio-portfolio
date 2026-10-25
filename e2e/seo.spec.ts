import { expect, test, type Page } from "@playwright/test";

// 검색/공유 태그, sitemap, robots, 예전 주소 301 (DATA_STORE=memory 시드).
// 화면 크기와 상관없는 응답이라 기본 프로젝트(laptop)에서만 돈다 (playwright.config.ts).
// e2e 서버는 NEXT_PUBLIC_SITE_URL 이 이 서버 주소이고 VERCEL_ENV 가 없다 (미리보기처럼 noindex)

const site = "http://localhost:3100";
// head 태그의 절대 주소. Next 는 루트 주소의 끝 / 를 뗀다 (http://x 와 http://x/ 는 같은 주소, sitemap 은 / 를 붙인다)
const url = (path: string) => (path === "/" ? site : `${site}${path}`);

const head = (page: Page) => ({
  canonical: page.locator('link[rel="canonical"]'),
  hreflang: (lang: string) =>
    page.locator(`link[rel="alternate"][hreflang="${lang}"]`),
  meta: (key: string) =>
    page.locator(`meta[property="${key}"], meta[name="${key}"]`),
});

const pages = [
  { path: "/", en: "/en", title: "Machum Studio | 서울의 사진 스튜디오" },
  {
    path: "/portfolio",
    en: "/en/portfolio",
    title: "포트폴리오 | Machum Studio",
  },
  { path: "/about", en: "/en/about", title: "소개 | Machum Studio" },
  { path: "/services", en: "/en/services", title: "서비스 | Machum Studio" },
  { path: "/contact", en: "/en/contact", title: "문의하기 | Machum Studio" },
];

for (const { path, en, title } of pages) {
  test(`${path}: canonical, hreflang(ko/en/x-default), OG/X 카드`, async ({
    page,
  }) => {
    await page.goto(path);
    const tags = head(page);
    await expect(page).toHaveTitle(title);
    await expect(tags.canonical).toHaveAttribute("href", url(path));
    await expect(tags.hreflang("ko")).toHaveAttribute("href", url(path));
    await expect(tags.hreflang("en")).toHaveAttribute("href", url(en));
    await expect(tags.hreflang("x-default")).toHaveAttribute("href", url(path));
    await expect(tags.meta("og:title")).toHaveAttribute("content", title);
    await expect(tags.meta("og:url")).toHaveAttribute("content", url(path));
    await expect(tags.meta("og:locale")).toHaveAttribute("content", "ko_KR");
    await expect(tags.meta("og:image")).toHaveAttribute(
      "content",
      `${site}/og/machum-studio-ko.jpg`,
    );
    await expect(tags.meta("og:image:width")).toHaveAttribute(
      "content",
      "1200",
    );
    await expect(tags.meta("og:image:height")).toHaveAttribute(
      "content",
      "630",
    );
    await expect(tags.meta("twitter:card")).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    await expect(tags.meta("og:description")).toHaveAttribute("content", /.+/);

    // 영어 페이지: canonical 은 자기 주소, 카드는 영어
    await page.goto(en);
    await expect(tags.canonical).toHaveAttribute("href", url(en));
    await expect(tags.hreflang("x-default")).toHaveAttribute("href", url(path));
    await expect(tags.meta("og:locale")).toHaveAttribute("content", "en_US");
    await expect(tags.meta("og:image")).toHaveAttribute(
      "content",
      `${site}/og/machum-studio-en.jpg`,
    );
  });
}

test("기본 공유 카드 이미지가 있다 (1200x630 JPEG)", async ({ page }) => {
  for (const locale of ["ko", "en"]) {
    const response = await page.request.get(`/og/machum-studio-${locale}.jpg`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/jpeg");
  }
});

test("작업 상세: 작업 제목/설명, 대표 사진 카드, article, canonical 과 hreflang", async ({
  page,
}) => {
  await page.goto("/en/work/a-wedding-tale");
  const tags = head(page);
  await expect(tags.canonical).toHaveAttribute(
    "href",
    `${site}/en/work/a-wedding-tale`,
  );
  await expect(tags.hreflang("ko")).toHaveAttribute(
    "href",
    `${site}/work/a-wedding-tale`,
  );
  await expect(tags.meta("og:type")).toHaveAttribute("content", "article");
  await expect(tags.meta("og:title")).toHaveAttribute(
    "content",
    "A Wedding Tale | Machum Studio",
  );
  await expect(tags.meta("og:description")).toHaveAttribute(
    "content",
    '"A Wedding Tale" by Machum Studio · Events, September 2021',
  );
  await expect(tags.meta("og:image")).toHaveAttribute(
    "content",
    `${site}/images/works/a-wedding-tale-1.jpg`,
  );
  await expect(tags.meta("twitter:image")).toHaveAttribute(
    "content",
    `${site}/images/works/a-wedding-tale-1.jpg`,
  );
});

test("구조화 데이터: 홈은 Organization + WebSite, 작업 상세는 CreativeWork", async ({
  page,
}) => {
  const jsonLd = async () =>
    JSON.parse(
      (await page
        .locator('script[type="application/ld+json"]')
        .textContent()) ?? "",
    );
  await page.goto("/");
  const home = await jsonLd();
  expect(
    home["@graph"].map((node: { "@type": string }) => node["@type"]),
  ).toEqual(["Organization", "WebSite"]);
  expect(home["@graph"][0]).toMatchObject({
    name: "Machum Studio",
    email: "hello@example.com",
  });

  await page.goto("/work/a-wedding-tale");
  expect(await jsonLd()).toMatchObject({
    "@type": "CreativeWork",
    name: "어느 결혼식 이야기",
    dateCreated: "2021-09",
    genre: "이벤트",
    image: [
      `${site}/images/works/a-wedding-tale-1.jpg`,
      `${site}/images/works/a-wedding-tale-2.jpg`,
      `${site}/images/works/a-wedding-tale-3.jpg`,
    ],
  });
});

test("운영이 아닌 배포는 페이지, 사진, sitemap 모두 noindex", async ({
  page,
}) => {
  const response = await page.goto("/about");
  expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  await expect(head(page).meta("robots")).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  for (const path of ["/images/works/a-wedding-tale-1.jpg", "/sitemap.xml"])
    expect((await page.request.get(path)).headers()["x-robots-tag"], path).toBe(
      "noindex, nofollow",
    );
  // next-intl 의 hreflang Link 헤더는 끈다 (hreflang 은 metadata 가 맡는다)
  expect(response?.headers()["link"] ?? "").not.toContain("hreflang");
});

test("robots.txt: 모두 허용, /admin 차단, sitemap 주소", async ({ page }) => {
  const response = await page.request.get("/robots.txt");
  expect(response.status()).toBe(200);
  expect((await response.text()).trim().split("\n")).toEqual([
    "User-Agent: *",
    "Allow: /",
    "Disallow: /admin",
    "",
    `Sitemap: ${site}/sitemap.xml`,
  ]);
});

test("sitemap.xml: 공개 페이지와 공개 작업만 (ko/en, 대체 주소, 수정 시각)", async ({
  page,
}) => {
  const response = await page.request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc);

  for (const { path, en } of pages)
    expect(locs).toEqual(
      expect.arrayContaining([`${site}${path}`, `${site}${en}`]),
    );
  // 공개 시드 작업 9개 × 2개 언어 (관리자 e2e 가 잠깐 만드는 작업(event-record-…)은 뺀다)
  const works = locs.filter((loc) => loc.includes("/work/"));
  expect(works.filter((loc) => !/\/work\/event-record-/.test(loc)).length).toBe(
    18,
  );
  expect(locs).toContain(`${site}/en/work/a-wedding-tale`);
  // 비공개 작업, 관리자, 개발용 화면은 없다
  expect(xml).not.toContain("behind-the-scenes");
  expect(xml).not.toContain("/admin");
  expect(xml).not.toContain("/tokens");

  // 한 줄의 대체 주소와 수정 시각
  const entry = xml.match(
    new RegExp(
      `<url>\\s*<loc>${site}/work/a-wedding-tale</loc>[\\s\\S]*?</url>`,
    ),
  )?.[0];
  expect(entry).toContain(
    `<xhtml:link rel="alternate" hreflang="en" href="${site}/en/work/a-wedding-tale" />`,
  );
  expect(entry).toContain(
    `<xhtml:link rel="alternate" hreflang="x-default" href="${site}/work/a-wedding-tale" />`,
  );
  expect(entry).toContain("<lastmod>2026-10-24T00:00:00.000Z</lastmod>");
});

// 예전 사이트 주소 (src/lib/seo/legacy-redirects.ts). 브라우저가 따라가지 않게 maxRedirects: 0
for (const [from, to] of [
  ["/gallery", "/portfolio"],
  ["/gallery/a-wedding-tale", "/work/a-wedding-tale"],
  ["/ko/gallery/a-wedding-tale", "/work/a-wedding-tale"],
  ["/en/gallery/a-wedding-tale", "/en/work/a-wedding-tale"],
  ["/about-us", "/about"],
  ["/en/about-us", "/en/about"],
  ["/pricing", "/services"],
  ["/contact-us", "/contact"],
  ["/index.html", "/"],
]) {
  test(`${from} 는 301 로 ${to} (한 번에 도착)`, async ({ page }) => {
    const response = await page.request.get(from, { maxRedirects: 0 });
    expect(response.status()).toBe(301);
    expect(new URL(response.headers()["location"]!, site).pathname).toBe(to);
    // 도착한 주소는 다시 이동하지 않는다 (고리, 연쇄 없음)
    const arrived = await page.request.get(to, { maxRedirects: 0 });
    expect(arrived.status()).toBe(200);
  });
}

test("예전 주소의 작업이 지금 없으면 이동한 뒤 404", async ({ page }) => {
  const response = await page.goto("/gallery/nope");
  expect(response?.status()).toBe(404);
  expect(new URL(page.url()).pathname).toBe("/work/nope");
});
