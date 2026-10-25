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
  // actions/queries: 서버 액션과 RSC 읽기, routes: app 의 route handler 가 부르는 입구
  {
    category: "server-entry",
    pattern: "src/features/*/{actions,queries,routes}.ts",
  },
  { category: "test", pattern: "**/*.test.{ts,tsx}" },
  // 요청마다 라우팅 전에 도는 proxy (언어 처리, /admin 빠른 확인). 폴더가 아니라 파일 하나라 파일 분류로 둔다
  { category: "proxy", pattern: "src/proxy.ts" },
  {
    category: "proxy-session",
    pattern: "src/infrastructure/admin-auth/proxy-session.ts",
  },
  { category: "return-to", pattern: "src/features/admin-auth/return-to.ts" },
  // proxy 가 관리자 상세 주소의 문의/작업이 있는지 묻는 입구 (docs/adr/0019)
  { category: "proxy-check", pattern: "src/features/*/proxy-check.ts" },
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
  // features 는 actions.ts / queries.ts / routes.ts / proxy-check.ts 에서만 infrastructure/container.ts 를 쓴다
  {
    from: {
      element: { type: "features" },
      file: { categories: ["server-entry", "proxy-check"] },
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
  // proxy 는 i18n 설정, 관리자 세션 빠른 확인(infrastructure), 돌아올 주소 규칙과 상세 존재 확인(features)만 쓴다
  {
    from: { file: { categories: "proxy" } },
    allow: {
      to: [
        { element: { type: "config" } },
        { module: { origin: ["external", "core"] } },
        {
          element: { type: "infrastructure" },
          file: { categories: "proxy-session" },
        },
        {
          element: { type: "features" },
          file: { categories: ["return-to", "proxy-check"] },
        },
      ],
    },
  },
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
            // 외부 패키지는 domain, application 을 뺀 모든 곳에서 허용 (SDK 제한은 아래 no-restricted-imports)
            {
              from: { element: { type: "!{domain,application}" } },
              allow: { to: { module: { origin: ["external", "core"] } } },
            },
            // domain 은 순수 TS, application 은 포트에만 의존한다 (zod, React, SDK 모두 금지)
            {
              from: { element: { type: ["domain", "application"] } },
              disallow: { to: { module: { origin: ["external", "core"] } } },
              message:
                "{{from.type}}/ 은 외부 라이브러리 import 금지: {{dependency.source}} (docs/architecture.md)",
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
      // Tailwind 임의값 금지 (ADR 0001). bg-[#...], text-[17px], w-[calc(...)] 등.
      // data-[state=open]: 같은 임의 variant(뒤에 ':' 가 붙는 것)는 허용
      "no-restricted-syntax": [
        "error",
        ...["Literal", "TemplateElement"].map((node) => ({
          selector: `${node}[${node === "Literal" ? "value" : "value.raw"}=/(^|[\\s:'"])!?-?[a-z][\\w-]*-\\[[^\\]]+\\](?!:)/]`,
          message:
            "Tailwind 임의값 금지. docs/design/tokens.css 의 토큰을 쓴다 (ADR 0001)",
        })),
        // Grey/40 글자는 어두운 배경(Dark/03~)에서 3.41:1 이하라 WCAG AA(4.5:1) 미달 (docs/accessibility.md)
        ...["Literal", "TemplateElement"].map((node) => ({
          selector: `${node}[${node === "Literal" ? "value" : "value.raw"}=/\\btext-grey-40\\b/]`,
          message:
            "Grey/40 글자는 어두운 배경에서 명도 대비 미달. 흐린 글자는 text-grey-50 을 쓴다 (docs/accessibility.md)",
        })),
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
