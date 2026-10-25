import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { toNextRedirects } from "./src/lib/seo/legacy-redirects";
import { isIndexable, noindexHeader } from "./src/lib/seo/site";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// 관리자가 올린 작업 사진: Supabase Storage 공개 버킷 (src/infrastructure/works/supabase-photo-storage.ts, ADR 0014).
// 그 버킷 경로만 next/image 최적화를 허용한다. env 가 없으면(CI 빌드, 인메모리) 바깥 사진은 없다.
// 시드 사진(/images/works)과 인메모리 사진(/media/work-photos)은 같은 사이트 주소라 따로 열지 않아도 된다
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(
  /\/+$/,
  "",
);
const workPhotoPattern = supabaseUrl
  ? [new URL(`${supabaseUrl}/storage/v1/object/public/work-photos/**`)]
  : [];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: workPhotoPattern,
    // 최적화한 사진을 다시 만들기까지 최소 7일 (Next 16 기본 4시간). Vercel Hobby 는 이미지 변환이 월 5,000회이고,
    // Storage 사진(바깥 주소)은 이 값과 원본 max-age(1시간) 중 큰 값이 지나면 다음 요청 때 다시 변환해 횟수를 쓴다.
    // 사진 주소는 UUID 이고 덮어쓰지 않아서(ADR 0014) 오래 둬도 낡은 사진이 나오지 않는다. 대신 지운 사진도
    // 최적화 주소(/_next/image?url=...)로는 최대 7일 더 열린다 (원래 주소를 알아야 한다). 형식은 WebP 만 (ADR 0021)
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  // 운영(VERCEL_ENV=production)이 아닌 배포: 페이지, 사진, sitemap 까지 모든 응답에 noindex 헤더.
  // 페이지에는 metadata 의 robots 메타 태그도 붙는다 ([locale]/layout.tsx). 빌드 때 정해진다
  // 예전 사이트 주소의 301. 규칙 목록은 src/lib/seo/legacy-redirects.ts 한 곳에 둔다
  redirects: async () => toNextRedirects(),
  headers: async () =>
    isIndexable()
      ? []
      : [{ source: "/:path*", headers: [{ ...noindexHeader }] }],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
