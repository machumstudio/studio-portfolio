import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import boundaries from "eslint-plugin-boundaries";

// 레이어 의존 규칙: docs/architecture.md 의 표. 표를 바꾸면 여기도 바꾼다.
const elements = [
  { type: "shared", pattern: "src/shared" },
  { type: "domain", pattern: "src/domain" },
  { type: "application", pattern: "src/application" },
  { type: "infrastructure", pattern: "src/infrastructure" },
  { type: "features", pattern: "src/features" },
  { type: "ui", pattern: "src/components/ui" },
  { type: "sections", pattern: "src/components/sections" },
  { type: "app", pattern: "src/app" },
  // 표에 없는 프레임워크 설정. 화면 쪽(app, components, features)에서 쓴다
  { type: "config", pattern: "src/i18n" },
  { type: "config", pattern: "src/lib" },
];

// 레이어 안에서 파일 단위로 구분해야 하는 것
const files = [
  { category: "container", pattern: "src/infrastructure/container.ts" },
  { category: "server-entry", pattern: "src/features/*/{actions,queries}.ts" },
  { category: "test", pattern: "**/*.test.{ts,tsx}" },
];

const allow = (from, ...types) => ({
  from: { element: { type: from } },
  allow: { to: { element: { type: types } } },
});
// 타입 import 만 허용 (features, app → domain)
const allowTypes = (from, ...types) => ({
  ...allow(from, ...types),
  dependency: { kind: "type" },
});

const layerPolicies = [
  allow("shared", "shared"),
  allow("domain", "shared", "domain"),
  allow("application", "shared", "domain", "application"),
  allow("infrastructure", "shared", "domain", "application", "infrastructure"),
  allow("features", "shared", "application", "features", "ui", "config"),
  allowTypes("features", "domain"),
  // features 는 actions.ts / queries.ts 에서만 infrastructure/container.ts 를 쓴다
  {
    from: {
      element: { type: "features" },
      file: { categories: "server-entry" },
    },
    allow: {
      to: {
        element: { type: "infrastructure" },
        file: { categories: "container" },
      },
    },
  },
  allow("ui", "shared", "ui", "config"),
  allow("sections", "shared", "ui", "sections", "config"),
  allow("app", "shared", "features", "ui", "sections", "app", "config"),
  allowTypes("app", "domain"),
  allow("config", "config"),
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": elements,
      "boundaries/files": files,
      "import/resolver": { typescript: { alwaysTryTypes: true } },
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message:
            "레이어 의존 규칙 위반: {{from.type}} → {{to.type}} (docs/architecture.md)",
          policies: [
            ...layerPolicies,
            // 외부 패키지는 domain 을 뺀 모든 곳에서 허용 (SDK 제한은 아래 no-restricted-imports)
            {
              from: { element: { type: "!domain" } },
              allow: { to: { module: { origin: ["external", "core"] } } },
            },
            {
              from: { element: { type: "domain" } },
              disallow: { to: { module: { origin: ["external", "core"] } } },
              message:
                "domain/ 은 순수 TS. 외부 라이브러리 import 금지: {{dependency.source}} (docs/architecture.md)",
            },
            // 테스트 파일의 vitest 만 예외
            {
              from: { file: { categories: "test" } },
              allow: { to: { module: { source: "vitest" } } },
            },
          ],
          checkAllOrigins: true,
        },
      ],
    },
  },
  {
    // 외부 SDK 는 infrastructure 안에서만 (ADR 0003)
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/infrastructure/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@supabase/*", "resend"],
              message:
                "외부 SDK 는 src/infrastructure 안에서만 import 한다 (ADR 0003)",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "storybook-static/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
