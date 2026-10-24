import { describe, expect, it } from "vitest";
import { legacyRedirects, toNextRedirects } from "./legacy-redirects";
import { sitePages } from "./sitemap";

// 경로 패턴(/a/:b)을 정규식으로. 규칙은 이 문법만 쓴다 (아래 "문법" 테스트)
const pattern = (path: string) =>
  new RegExp(`^${path.replace(/:[a-z]+/g, "[^/]+")}$`);
const matches = (path: string, url: string) => pattern(path).test(url);
// :이름 자리를 예시 값으로 채운 실제 주소
const sample = (path: string) => path.replace(/:[a-z]+/g, "sample-slug");

// 지금 사이트에 있는 페이지 (언어 접두사 포함)
const siteRoutes = [...sitePages.map(({ path }) => path), "/work/:slug"]
  .flatMap((path) => [path, path === "/" ? "/en" : `/en${path}`])
  .map(pattern);
const isSiteRoute = (url: string) => siteRoutes.some((re) => re.test(url));

const redirects = toNextRedirects();

describe("toNextRedirects", () => {
  it("언어마다 펼친다: ko 는 접두사 없음과 /ko, en 은 /en. 모두 301", () => {
    expect(
      toNextRedirects([{ from: "/gallery/:slug", to: "/work/:slug" }]),
    ).toEqual([
      {
        source: "/gallery/:slug",
        destination: "/work/:slug",
        statusCode: 301,
      },
      {
        source: "/ko/gallery/:slug",
        destination: "/work/:slug",
        statusCode: 301,
      },
      {
        source: "/en/gallery/:slug",
        destination: "/en/work/:slug",
        statusCode: 301,
      },
    ]);
    expect(toNextRedirects([{ from: "/index.html", to: "/" }])).toEqual([
      { source: "/index.html", destination: "/", statusCode: 301 },
      { source: "/ko/index.html", destination: "/", statusCode: 301 },
      { source: "/en/index.html", destination: "/en", statusCode: 301 },
    ]);
  });

  it("308(permanent) 이 아니라 301", () => {
    for (const redirect of redirects) {
      expect(redirect).toMatchObject({ statusCode: 301 });
      expect(redirect).not.toHaveProperty("permanent");
    }
  });
});

describe("legacyRedirects 목록 검사 (운영자가 규칙을 더할 때 지켜야 하는 것)", () => {
  it.each(legacyRedirects)(
    "문법: $from → $to 는 / 로 시작하고, to 의 :이름은 from 에 있다",
    ({ from, to }) => {
      const segment = /^\/([a-z0-9][a-z0-9.-]*|:[a-z]+)?$/;
      for (const path of [from, to])
        for (const part of path.split(/(?=\/)/))
          expect(part, path).toMatch(segment);
      const params = (path: string) => path.match(/:[a-z]+/g) ?? [];
      for (const param of params(to)) expect(params(from)).toContain(param);
    },
  );

  it("같은 예전 주소가 두 번 나오지 않는다", () => {
    const sources = redirects.map(({ source }) => source);
    expect(new Set(sources).size).toBe(sources.length);
  });

  it.each(redirects)(
    "$source → $destination: 지금 있는 페이지로 한 번에 간다 (다른 규칙을 다시 타지 않는다 = 고리 없음)",
    ({ source, destination }) => {
      const arrived = sample(destination);
      expect(isSiteRoute(arrived)).toBe(true);
      const next = redirects.filter((r) => matches(r.source, arrived));
      expect(next).toEqual([]);
      expect(matches(source, arrived)).toBe(false);
    },
  );

  it.each(redirects)(
    "$source 는 지금 있는 페이지를 가리지 않는다",
    ({ source }) => {
      expect(isSiteRoute(sample(source))).toBe(false);
    },
  );
});
