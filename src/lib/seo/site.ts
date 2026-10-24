// 사이트 주소와 검색 노출 여부. 운영 주소는 배포(22칸) 때 정해지므로 환경 변수로 받는다.
// next.config.ts 도 이 파일을 읽어서 "@/" 별칭 없이 상대 경로만 쓴다

type Env = Readonly<Record<string, string | undefined>>;

const localUrl = "http://localhost:3000";

const withProtocol = (host: string) =>
  /^https?:\/\//.test(host) ? host : `https://${host}`;

/**
 * canonical, hreflang, sitemap, OG 의 절대 주소 기준. 끝의 / 는 뗀다.
 * 1. NEXT_PUBLIC_SITE_URL (운영 도메인을 붙이면 여기에)
 * 2. Vercel 운영 배포: VERCEL_PROJECT_PRODUCTION_URL (프로젝트의 운영 도메인)
 * 3. Vercel 미리보기: VERCEL_URL (그 배포의 주소)
 * 4. 없으면 로컬 http://localhost:3000
 */
export function readSiteUrl(env: Env = process.env): string {
  const candidates = [
    env.NEXT_PUBLIC_SITE_URL,
    env.VERCEL_ENV === "production"
      ? env.VERCEL_PROJECT_PRODUCTION_URL
      : undefined,
    env.VERCEL_URL,
  ];
  const found = candidates.map((value) => value?.trim()).find(Boolean);
  return new URL(found ? withProtocol(found) : localUrl).origin;
}

/**
 * 검색엔진에 보여도 되는 배포인가. Vercel 운영 배포만 true.
 * 미리보기, 로컬, CI 빌드는 모든 화면에 noindex 를 붙여 미리보기 주소가 검색에 잡히지 않게 한다
 */
export function isIndexable(env: Env = process.env): boolean {
  return env.VERCEL_ENV === "production";
}

/** 운영이 아닌 배포의 응답 헤더. 사진 같은 정적 파일도 덮으려고 next.config headers 로 붙인다 */
export const noindexHeader = {
  key: "X-Robots-Tag",
  value: "noindex, nofollow",
} as const;
