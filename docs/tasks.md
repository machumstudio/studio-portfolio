# 작업표 (20칸, 1칸 = 평일 저녁 2~3시간)

각 칸이 끝나면: lint/typecheck/test 통과 → 시각 비교 차이율 기록 → 커밋.

| # | 작업 | 완료 기준 |
|---|---|---|
| 1 | 세팅 | create-next-app(TS, App Router, Tailwind v4, src/, pnpm) · tokens.css 반영 · Manrope next/font · ESLint/Prettier · Vitest · Playwright(390/1440/1920 프로젝트) · Storybook · next-intl 기본 구조 · `/` 에 토큰 확인용 임시 페이지 |
| 2 | 기본 UI | Button, SectionHeading, Tag, Field + 스토리 |
| 3 | 레이아웃 | Header(모바일 메뉴, 현재 페이지 표시), Footer, CTA, CategoryMarquee |
| 4 | 인터랙션 | FaqAccordion(키보드/ARIA), Testimonials 슬라이더 |
| 5 | Home 1 | Hero + About 요약 |
| 6~8 | Home 2 / Portfolio / 작업 상세 / DB | Services 슬라이더, Portfolio 미리보기, Portfolio 페이지(카테고리 필터), `/work/[slug]` + Lightbox, Supabase 스키마(works, work_images, inquiries) + 읽기 연결 |
| 9 | About | 통계, 타임라인 |
| 10 | Services | PriceCard |
| 11 | Contact | react-hook-form + zod 폼 → Supabase inquiries 저장, 성공/실패 상태 |
| 12 | 알림 + i18n | 문의 접수 즉시 이메일(Resend) 또는 Slack 웹훅, ko/en 전환 |
| 13 | 마감 1 | 태블릿 768 점검, 사진 Unsplash 교체, Machum Studio 문구 |
| 14~16 | 관리자 | Supabase Auth 로그인, 작업 CRUD + 이미지 드래그 업로드/순서 변경, 문의 목록 + 상태 변경, RLS |
| 17 | SEO/성능 | metadata/OG, sitemap, robots, 301 예시, 이미지 최적화, Lighthouse 측정 |
| 18 | 품질 | 접근성 점검, E2E(문의 제출, 관리자 로그인 → 작업 등록) |
| 19 | 배포 | Vercel, README(스크린샷, Lighthouse 표, 시안 재현도, 크레딧) + `docs/ops-manual.md`(관리자 사용법) |
| 20 | 케이스 스터디 | 요구사항 → 구현 매핑 → 수치 → URL (위시켓 포트폴리오용) |

## 1칸 시작 프롬프트 (Claude Code에 그대로 붙여 넣기)
```
CLAUDE.md, docs/design/figma-spec.md, docs/design/tokens.css 를 먼저 읽어줘.
docs/tasks.md 의 1번 "세팅"을 해줘.
- 현재 폴더에 Next.js(App Router, TypeScript, Tailwind v4, src 디렉토리, pnpm)로 프로젝트를 만들어. 폴더가 비어 있지 않아서 create-next-app이 막히면 임시 폴더에 만든 뒤 옮겨. docs/, CLAUDE.md, CREDITS.md, SETUP.md 는 그대로 둬.
- .gitignore 에 docs/design/reference/ 를 추가해 (시안 원본 사진이 공개 레포에 올라가지 않게. 시각 비교는 로컬에서만).
- tokens.css 내용을 src/app/globals.css 에 반영하고 Manrope(400/500/600/700)를 next/font 로 --font-manrope 에 연결해.
- Vitest, Playwright(뷰포트 390x900, 1440x900, 1920x1080 세 프로젝트), Storybook, ESLint/Prettier, next-intl(ko 기본, en) 기본 구조를 세팅해.
- package.json 스크립트: dev, build, lint, typecheck, test, test:e2e, test:visual, storybook.
- / 에 색 26개 견본과 text-display~text-body 견본을 보여주는 임시 토큰 페이지를 만들어.
- 끝나면 lint/typecheck/test 결과와 만든 파일 목록을 보여주고, 커밋 메시지 초안을 줘. 커밋은 내가 확인하고 할게.
```
