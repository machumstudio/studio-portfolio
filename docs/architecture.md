# 아키텍처

목표: 화면은 시안 그대로, 코드는 "어디에 무엇이 있는지" 바로 보이게.
정적인 마케팅 섹션은 단순하게 두고, 규칙과 외부 의존이 있는 기능(문의, 작업 관리, 관리자 인증)만 레이어를 나눈다. 필요 없는 곳에 구조를 얹지 않는 것도 설계다.

## 레이어

```
src/
  app/                    라우팅과 조립. 로직 없음
  components/
    ui/                   디자인 시스템 (Button, Field, Tag ...). props만 받는다
    sections/             마케팅 섹션 (Hero, Faq ...). 데이터는 props로만
  features/<context>/     인터랙티브 기능의 UI + 서버 진입점
    ui/                   폼, 관리자 화면 컴포넌트
    actions.ts            "use server". 입력 검증(zod) → 유스케이스 호출 → 결과 매핑
    queries.ts            server-only 읽기 (RSC에서 호출)
    schema.ts             폼 스키마(zod). 도메인 입력으로 변환
  application/<context>/  유스케이스와 포트(인터페이스). 외부 SDK 모름
  domain/<context>/       엔티티, 값 객체, 상태 전이, 도메인 에러. 순수 TS
  infrastructure/         포트 구현(Supabase, 이메일, Slack)과 조립(container.ts, server-only)
  shared/                 Result, Brand, assertNever 같은 범용 타입/함수
  i18n/                   next-intl 설정
  lib/                    폰트 등 프레임워크 설정
```

컨텍스트: `inquiry`(문의), `works`(작업/이미지), `admin-auth`(관리자 로그인)

## 의존 규칙 (ESLint로 강제, CI에서 실패 처리)

| from \ to | shared | domain | application | infrastructure | features | components/ui | components/sections |
|---|---|---|---|---|---|---|---|
| shared | - | X | X | X | X | X | X |
| domain | O | - | X | X | X | X | X |
| application | O | O | - | X | X | X | X |
| infrastructure | O | O | O (포트) | - | X | X | X |
| features | O | O (타입) | O | container만 (actions/queries에서) | - | O | X |
| components/ui | O | X | X | X | X | - | X |
| components/sections | O | X | X | X | X | O | - |
| app | O | O (타입) | X | X | O | O | O |

- `@supabase/*`, `resend` 같은 외부 SDK import는 `infrastructure/` 안에서만 허용
- `infrastructure/`, `features/*/queries.ts`, `features/*/actions.ts`는 `server-only`
- `domain/`은 React, Next, zod 등 어떤 라이브러리도 import하지 않는다

## 도메인 모델링 규칙
- ID는 브랜드 타입: `type InquiryId = Brand<string, "InquiryId">`
- 실패는 throw 대신 `Result<T, E>`. 에러는 판별 유니온: `{ type: "InvalidEmail" } | { type: "MessageTooLong"; max: number }`
- 상태는 판별 유니온 + 전이 함수. 문의: `New → Read → Done`(되돌리기 `Done → Read` 허용). 허용되지 않은 전이는 `Result` 에러
- 생성은 스마트 생성자(`createInquiry(input): Result<Inquiry, InquiryError>`)로만
- switch에는 `assertNever`로 누락 방지

## 데이터 흐름 예시

문의 제출
```
features/inquiry/ui/InquiryForm (client, react-hook-form + zod)
  → features/inquiry/actions.ts submitInquiryAction (server)
    → schema.parse → application/inquiry/submitInquiry({ repo, notifier, clock })(input)
       → domain/inquiry/createInquiry → repo.save → notifier.notify (실패해도 저장은 유지, 결과에 경고)
    → Result를 화면용 상태로 매핑 (성공 / 필드 에러 / 일시 오류)
```

작업 목록 표시
```
app/[locale]/portfolio/page.tsx (RSC)
  → features/works/queries.ts getPublishedWorks() (server-only)
    → infrastructure container의 WorkRepository
  → components/sections/PortfolioGallery 에 props로 전달
```

## 테스트 전략
| 대상 | 도구 | 방식 |
|---|---|---|
| domain | Vitest | 순수 함수 단위 테스트, 상태 전이 표 전체 |
| application | Vitest | 포트를 인메모리 가짜로 주입 |
| infrastructure | Vitest | 리포지토리 계약 테스트 (인메모리 구현과 Supabase 구현이 같은 테스트를 통과) |
| components | Vitest + Testing Library, Storybook | 렌더, 키보드, aria, 변형별 스토리 |
| 화면 흐름 | Playwright | 문의 제출, 관리자 로그인 → 작업 등록 |
| 시안 재현 | Playwright + pixelmatch | 390/1440/1920 차이율 |

## 서버/클라이언트 경계
- 기본은 Server Component. 인터랙션이 필요한 말단만 `"use client"` (아코디언, 슬라이더, 폼, 라이트박스, 모바일 메뉴)
- 클라이언트 컴포넌트는 `features/*/ui`나 `components/ui`에만 둔다

## 작업 방식
- 칸마다 GitHub 이슈 1개 → 브랜치 `slot/NN-short-name` → PR → CI 통과 후 Rebase and merge
- 커밋 규칙: docs/commit-convention.md
- PR 본문은 템플릿(변경 요약, 스크린샷, 시각 차이율, 테스트, 체크리스트)
- 구조를 바꾸는 결정은 `docs/adr/`에 남긴다
