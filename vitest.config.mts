import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.mjs"],
    // 클라우드 DB 를 쓰는 테스트는 pnpm test:contract 로만 (vitest.contract.config.mts)
    exclude: ["src/**/*.contract.test.ts", "**/node_modules/**"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
