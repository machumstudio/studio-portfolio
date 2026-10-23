# 작업표 (23칸, 1칸 = 평일 저녁 2~3시간)

진행 방식: 칸마다 이슈 → 브랜치 `slot/NN-name` → PR → CI 통과 → Rebase and merge (docs/adr/0005). 커밋 규칙은 docs/commit-convention.md.
칸이 끝나면: lint/typecheck/test 통과, 시각 비교 차이율을 PR에 기록.
구조 규칙은 docs/architecture.md. 기능 영역(works, inquiry, admin-auth)은 domain → application → infrastructure → features 순서로 만든다.

| # | 작업 | 완료 기준 |
|---|---|---|
| 01 | 세팅 ✅ | Next 16, Tailwind v4 토큰, Manrope, next-intl, Vitest/Playwright/Storybook, 시각 비교 스크립트 (7ed4f2e) |
| 02 | 아키텍처 기반 | 폴더 골격, shared(Result/Brand/assertNever), ESLint 의존 규칙 + 임의값 금지 + SDK import 제한, server-only, commitlint + husky + lint-staged, GitHub Actions CI(commitlint 포함), README(구조/스크립트/ADR 링크/CI 배지) |
| 03 | 기본 UI | Button, SectionHeading, Tag, Field + 스토리/테스트 |
| 04 | 레이아웃 | Header(모바일 메뉴, 현재 페이지 표시), Footer, CTA, CategoryMarquee |
| 05 | 인터랙션 | FaqAccordion(키보드/ARIA), Testimonials 슬라이더 |
| 06 | Home 1 | Hero + About 요약 섹션 |
| 07 | Home 2 | Services 슬라이더, Portfolio 미리보기 (데이터는 08 전까지 props 고정값) |
| 08 | works 도메인 + 읽기 | domain/works(Work, Slug, 이미지 순서 규칙), application(getPublishedWorks, getWorkBySlug, WorkRepository 포트), 인메모리 리포지토리 + 시드, features/works/queries, 07의 홈 Portfolio 고정값을 queries로 교체 |
| 09 | Portfolio / 작업 상세 | 카테고리 필터 + 그리드, `/work/[slug]` + Lightbox |
| 10 | About | 통계, 타임라인 |
| 11 | Services | PriceCard |
| 12 | inquiry 도메인 + 유스케이스 | Inquiry 엔티티, 상태 전이(New/Read/Done), 에러 유니온, submitInquiry/changeInquiryStatus, 포트(InquiryRepository, Notifier, Clock), 인메모리 구현, 전이표 전체 테스트 |
| 13 | Contact 폼 | features/inquiry: zod 스키마, InquiryForm, submitInquiryAction (인메모리로 동작) |
| 14 | Supabase 어댑터 | 마이그레이션(works, work_images, inquiries) + RLS, Supabase 리포지토리 2종, 인메모리와 같은 계약 테스트 통과, container 전환 |
| 15 | 알림 + 영어 | Notifier 어댑터(Resend 이메일 또는 Slack 웹훅, 실패해도 저장 유지), en 메시지 채우기 |
| 16 | 마감 1 | 태블릿 768 점검, Unsplash 사진 교체, Machum Studio 문구 |
| 17 | 관리자 인증 | Supabase Auth 어댑터, proxy로 /admin 보호, 로그인 화면 |
| 18 | 관리자 작업 관리 | 작업 CRUD, 이미지 드래그 업로드(Storage 어댑터) + 순서 변경, 공개/비공개 |
| 19 | 관리자 문의 관리 | 목록, 필터, 상태 전이 UI (도메인 전이 규칙 재사용) |
| 20 | SEO/성능 | metadata/OG, sitemap, robots, 301 예시, 이미지 최적화, Lighthouse |
| 21 | 품질 | 접근성 점검, E2E(문의 제출, 관리자 로그인 → 작업 등록) |
| 22 | 배포 | Vercel, README(스크린샷, Lighthouse 표, 시안 재현도) + docs/ops-manual.md |
| 23 | 케이스 스터디 | 요구사항 → 구현 매핑 → 수치 → URL (docs/requirements.md 기반) |

## 02칸 프롬프트 (Claude Code에 붙여 넣기)
```
CLAUDE.md, docs/architecture.md, docs/adr/ 를 먼저 읽어줘. docs/tasks.md 의 02 "아키텍처 기반"을 해줘.
진행: 이슈는 #1 "[slot 02] 아키텍처 기반". 브랜치 slot/02-architecture 에서 작업해.

1. 폴더 골격: docs/architecture.md 의 src 구조대로 만들고, 각 폴더에 역할을 한 줄로 적은 README.md 를 둬. 빈 폴더용 placeholder 코드는 만들지 마.
2. src/shared: Result<T, E>(ok/err, map, flatMap, match), Brand<T, K>, assertNever 를 함수형 스타일로 구현하고 Vitest 테스트.
3. ESLint:
   - docs/architecture.md 의 의존 규칙 표를 eslint-plugin-boundaries(또는 동등한 방법)로 강제. 규칙 위반 예시 파일로 실패하는지 확인한 뒤 그 파일은 지워.
   - @supabase/*, resend 는 src/infrastructure 밖에서 import 금지.
   - Tailwind 임의값(bg-[#...], text-[..px] 등) 금지 규칙.
   - domain/ 에서 react, next, zod 등 외부 import 금지.
4. server-only 패키지 추가 (infrastructure, features/*/queries.ts, actions.ts 에서 쓸 예정. 지금은 설치만).
5. 커밋 자동 검사: docs/commit-convention.md 대로 commitlint(config-conventional + type/scope 목록 + 요약 72자), husky commit-msg 훅, lint-staged pre-commit(prettier + eslint).
6. GitHub Actions: .github/workflows/ci.yml 에서 pnpm install → commitlint(PR의 커밋 범위) → lint → typecheck → test → build. 캐시 사용. Playwright 시각 비교는 제외 (ADR 0004).
7. README.md: 프로젝트 소개, 스택, 폴더 구조와 의존 규칙 요약(그림 1개), 스크립트 표, ADR 목록 링크, CI 배지, 크레딧. 아직 없는 것(라이브 URL, Lighthouse)은 TODO로.
8. 커밋은 docs/commit-convention.md 대로 논리 단위로 나눠서 해 (예: docs(docs) 아키텍처 문서와 ADR → feat(shared) → build(lint) 의존 규칙 → build 커밋 훅 → ci → docs README). 지금 작업 트리에 있는 docs/architecture.md, docs/adr/, docs/commit-convention.md, .github/ 템플릿, CLAUDE.md·docs/tasks.md 수정분은 첫 커밋(docs)으로 묶어줘.
9. 끝나면 lint/typecheck/test 결과, 의존 규칙과 commitlint가 실제로 실패를 잡는다는 증거(위반 시 에러 메시지), PR 본문 초안(.github/pull_request_template.md 형식)을 줘.
```
