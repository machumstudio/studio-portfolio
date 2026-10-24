import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

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
  images: { remotePatterns: workPhotoPattern },
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
