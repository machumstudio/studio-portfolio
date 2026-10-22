// docs/commit-convention.md 의 type/scope 목록. 문서를 바꾸면 여기도 바꾼다.
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "refactor",
        "test",
        "docs",
        "style",
        "perf",
        "build",
        "ci",
        "chore",
      ],
    ],
    "scope-enum": [
      2,
      "always",
      [
        "shared",
        "domain",
        "application",
        "infra",
        "works",
        "inquiry",
        "admin-auth",
        "ui",
        "sections",
        "pages",
        "i18n",
        "design",
        "deps",
        "lint",
        "hooks",
        "docs",
      ],
    ],
    // 요약은 한국어 72자 이내. 영어 고유명사(ESLint, Result)로 시작할 수 있어 대소문자 규칙은 끈다
    "subject-max-length": [2, "always", 72],
    "subject-case": [0],
  },
};

export default config;
