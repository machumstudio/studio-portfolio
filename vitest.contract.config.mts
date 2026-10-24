import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// 클라우드 Supabase 를 쓰는 계약/RLS 테스트 (pnpm test:contract). 단위 테스트(pnpm test)와 분리한다.
// - .env.local 의 값을 읽는다. 이미 있는 환경 변수(CI secrets)가 우선이고, 값이 없으면 모든 테스트를 건너뛴다
// - 개발과 테스트가 같은 DB 라 파일을 하나씩 순서대로 돌리고, 끝나면 works 시드와 기존 문의를 되돌린다
for (const [key, value] of Object.entries(loadEnv("test", process.cwd(), "")))
  process.env[key] ??= value;

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // 리포지토리는 server-only 를 import 한다. 테스트는 서버(Node)에서 돌기 때문에 비운다
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.contract.test.ts"],
    globalSetup: ["./src/infrastructure/supabase/contract.global-setup.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
