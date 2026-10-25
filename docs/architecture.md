# 아키텍처

목표: 화면은 시안 그대로, 코드는 "어디에 무엇이 있는지" 바로 보이게.
정적인 마케팅 섹션은 단순하게 두고, 규칙과 외부 의존이 있는 기능(문의, 작업 관리, 관리자 인증)만 레이어를 나눈다. 필요 없는 곳에 구조를 얹지 않는 것도 설계다.

## 레이어

```
src/
  app/                    라우팅과 조립. 로직 없음
  components/
    ui/                   디자인 시스템 (Button, Field, HighlightItem ...). props만 받는다
    sections/             마케팅 섹션 (Hero, Faq ...). 데이터는 props로만
  features/<context>/     인터랙티브 기능의 UI + 서버 진입점
    ui/                   폼, 관리자 화면 컴포넌트
    actions.ts            "use server". 입력 검증(zod) → 유스케이스 호출 → 결과 매핑
    queries.ts            server-only 읽기 (RSC에서 호출)
    routes.ts             server-only. app 의 route handler 가 부르는 입구 (인메모리 사진 업로드/읽기)
    schema.ts             폼 스키마(zod). 도메인 입력으로 변환
  application/<context>/  유스케이스와 포트(인터페이스). 외부 SDK 모름
  domain/<context>/       엔티티, 값 객체, 상태 전이, 도메인 에러. 순수 TS
  infrastructure/         포트 구현(Supabase, 이메일, Slack)과 조립(container.ts, server-only)
  shared/                 Result, Brand, assertNever 같은 범용 타입/함수
  i18n/                   next-intl 설정
  lib/                    폰트 등 프레임워크 설정. seo/: 사이트 주소, metadata, sitemap/robots, 301 규칙, 구조화 데이터 (docs/adr/0018)
```

컨텍스트: `inquiry`(문의), `works`(작업/이미지), `admin-auth`(관리자 로그인)

## 의존 규칙 (ESLint로 강제, CI에서 실패 처리)

| from \ to | shared | domain | application | infrastructure | features | components/ui | components/sections | i18n, lib |
|---|---|---|---|---|---|---|---|---|
| shared | - | X | X | X | X | X | X | X |
| domain | O | - | X | X | X | X | X | X |
| application | O | O | - | X | X | X | X | X |
| infrastructure | O | O | O (포트) | - | X | X | X | X |
| features | O | O (타입) | O | container만 (actions/queries에서) | - | O | X | O |
| components/ui | O | X | X | X | X | - | X | O |
| components/sections | O | X | X | X | X | O | - | O |
| app | O | O (타입) | X | X | O | O | O | O |

- `i18n/`(next-intl 설정, 로케일 Link, 날짜/가격 형식 훅)과 `lib/`(글꼴 등)은 ESLint 의 `config` 요소다. ui/sections 가 i18n 을 쓰는 것(`Link`, `useTranslations`, 형식 훅)은 허용이고, domain/application/infrastructure 는 쓰지 않는다
- `@supabase/*`, `resend` 같은 외부 SDK import는 `infrastructure/` 안에서만 허용
- `infrastructure/`, `features/*/queries.ts`, `features/*/actions.ts`, `features/*/routes.ts`, `features/*/proxy-check.ts`는 `server-only`. features 에서 `container.ts` 를 쓸 수 있는 곳도 이 네 종류 파일뿐이다
- `domain/`은 React, Next, zod 등 어떤 라이브러리도 import하지 않는다
- `application/`도 외부 패키지를 import하지 않는다 (포트와 domain, shared만). 테스트의 `vitest`만 예외
- `src/proxy.ts` 는 폴더가 아니라 파일 하나라 ESLint 파일 분류 `proxy` 로 둔다. i18n 설정, `infrastructure/admin-auth/proxy-session.ts`(관리자 세션 빠른 확인), `features/admin-auth/return-to.ts`(돌아갈 주소 규칙), `features/*/proxy-check.ts`(관리자 상세의 문의/작업이 있는지, docs/adr/0019)만 쓴다

## 도메인 모델링 규칙
- ID는 브랜드 타입: `type InquiryId = Brand<string, "InquiryId">`
- 실패는 throw 대신 `Result<T, E>`. 에러는 판별 유니온: `{ type: "InvalidEmail" } | { type: "MessageTooLong"; max: number }`
- 상태는 판별 유니온 + 전이 함수. 문의: `New → Read → Done`(되돌리기 `Done → Read` 허용). 허용되지 않은 전이는 `Result` 에러
- 생성은 스마트 생성자(`createInquiry(input): Result<Inquiry, InquiryError>`)로만
- switch에는 `assertNever`로 누락 방지
- 저장소에서 읽은 데이터도 domain 생성자(`createWork`, `restoreInquiry`)로 되살린다. 인프라 매퍼는 칼럼 모양만 바꾼다 (docs/adr/0010)

## 데이터 흐름 예시

문의 제출
```
features/inquiry/ui/InquiryForm (client, useActionState + <form action>. JS 없이도 POST 로 동작)
  → features/inquiry/actions.ts submitInquiryAction (server)
    → schema.safeParse(FormData 형태와 문자열 정리만) → application/inquiry/submitInquiry({ repo, notifier, clock, ids })(input)
       → domain/inquiry/createInquiry → repo.save → notifier.notify (실패해도 저장은 유지, 결과에 경고)
    → Result를 화면용 상태로 매핑 (성공 / 필드 에러 / 일시 오류)
  검증 규칙(필수, 한도, 형식)은 domain 한 곳에만 있다. 화면은 칸별 오류 코드를 메시지 키로 번역한다 (docs/adr/0009)
```

관리자 로그인 (docs/adr/0012, 0013)
```
GET /admin/works → src/proxy.ts → infrastructure/admin-auth/proxy-session (쿠키만. Supabase 는 getClaims + 토큰 갱신)
  → 관리자 아님 → 307 /admin/login?next=%2Fadmin%2Fworks
GET /admin/login?next=… → proxy 가 safeAdminReturnPath(같은 사이트 /admin 경로만)로 검사 → 쿠키에 담는다 → 완전 정적 로그인 화면
features/admin-auth/ui/AdminLoginForm (client, useActionState + <form action>. JS 없이도 POST)
  → features/admin-auth/actions.ts signInAction
    → schema(FormData 형태만) → application/admin-auth/signIn({ gateway })
       → domain parseCredentials → gateway.signInWithPassword (세션 쿠키) → domain authorizeAdmin
         (관리자가 아니면 세션을 끝내고 틀린 비밀번호와 같은 InvalidCredentials)
    → 성공: 돌아갈 곳 쿠키를 다시 검사해 303 redirect / 실패: 코드 하나와 이메일만
app/admin/page.tsx (RSC) → features/admin-auth/queries.ts requireAdmin → getCurrentAdmin (getUser 로 인증 서버 재확인)
```

작업 목록 표시
```
app/[locale]/portfolio/page.tsx (RSC)
  → features/works/queries.ts getPublishedWorks() ("use cache", cacheTag "works")
    → infrastructure container의 WorkRepository (secret 키)
  → components/sections/PortfolioGallery 에 props로 전달
```

관리자 작업 저장과 사진 올리기 (docs/adr/0014, 0015)
```
app/admin/works/[id]/page.tsx (RSC) → requireAdmin → features/works/queries.ts getAdminWork
  → container.works.admin() (요청의 관리자 세션으로 만든 Supabase 클라이언트 → RLS) → features/works/ui/WorkEditor (client, useReducer)
사진 한 장: WorkPhotos → photo-file checkPhotoFile → shrinkPhoto (캔버스, 긴 변 2400, EXIF 없이 다시 인코딩)
  → actions.ts preparePhotoUploadAction → application preparePhotoUpload → PhotoStorage.createUpload (서명 업로드 주소)
  → 브라우저가 Storage 로 직접 PUT (XMLHttpRequest 진행률) → src 를 편집 상태에 추가
저장: actions.ts saveWorkAction(화면 상태 JSON) → getAdmin (끝났으면 signedOut) → schema(형태만)
  → application saveWork: validateWorkFields(domain) + slug 중복 + 사진 출처/장수 → createWork → repo.save (save_work 함수, 한 트랜잭션)
    → cleanUpPhotos (이 작업 폴더의 안 쓰는 파일, 하루 지난 고아 파일. 실패는 경고)
  → updateTag("works") 로 공개 화면 캐시 비우기 → 칸별 오류 코드 또는 saved
DATA_STORE=memory: 같은 포트의 인메모리 구현. 업로드 주소는 app/admin/uploads/[token], 사진 주소는 app/media/work-photos/[...path] (features/works/routes.ts)
```

관리자 문의 처리 (docs/adr/0012, 0016)
```
GET /admin/inquiries?status=new&page=2 (RSC) → features/inquiry/admin-view parseInquiryListParams
  → queries.ts listAdminInquiries → requireAdmin → container.inquiry.admin() (요청의 관리자 세션 → RLS)
    → application listInquiries: countByStatus (head + count) → 페이지 수, 범위 보정 → findPage (received_at desc, id desc, offset/limit)
  → features/inquiry/ui/AdminInquiryList (필터/페이지는 링크). AdminShell 이 같은 개수로 "새 문의 N건"
GET /admin/inquiries/[id] → getAdminInquiry (열어도 상태를 바꾸지 않는다) → 허용 동작(domain allowedInquiryActions)만 버튼으로
상태 버튼: <form action> (숨은 칸 id, action. JS 없이도 POST) → actions.ts changeInquiryStatusAction
  → requireAdmin → application changeInquiryStatus (12칸 그대로: findById → domain transitionInquiry → save)
     오래된 화면(다른 탭이 먼저 바꿈)은 InvalidTransition → notice=conflict
  → revalidatePath("/admin", "layout") → redirect(상세?notice=… 또는 목록?notice=notFound) → 다시 그린 화면이 지금 상태를 보여 준다
지우기: 확인 <dialog> 안의 폼 → deleteInquiryAction → application deleteInquiry → repo.remove → 목록?notice=deleted
```

검색 노출 (docs/adr/0018)
```
공개 페이지 generateMetadata → app/[locale]/(site)/_seo/page-metadata → lib/seo/metadata pageMetadata
  → 제목/설명(메시지), canonical(지금 언어), hreflang ko/en + x-default, OG/X 카드 (기본 카드 public/og, 작업은 대표 사진)
[locale]/layout → metadataBase(lib/seo/site readSiteUrl) + 운영이 아니면 robots noindex. next.config headers 가 X-Robots-Tag 도 붙인다
app/sitemap.ts → features/works/queries getPublishedWorks ("works" 태그) → lib/seo/sitemap buildSitemap
  → 고정 페이지 5개 + 공개 작업 × ko/en, lastmod 는 Work.updatedAt (saveWork 가 Clock 에서). 저장 액션의 updateTag("works") 로 다시 만들어진다
app/robots.ts → /admin 차단 + sitemap 주소 (운영/미리보기 같음)
next.config redirects → lib/seo/legacy-redirects toNextRedirects (예전 주소 → 지금 주소, 언어마다, 301)
홈/작업 상세 → lib/seo/structured-data (Organization + WebSite / CreativeWork) → lib/seo/json-ld <script>
```

## 테스트 전략
| 대상 | 도구 | 방식 |
|---|---|---|
| domain | Vitest | 순수 함수 단위 테스트, 상태 전이 표 전체 |
| application | Vitest | 포트를 인메모리 가짜로 주입 |
| infrastructure | Vitest | 리포지토리/AuthGateway/PhotoStorage 계약 테스트 (인메모리 구현과 Supabase 구현이 같은 테스트를 통과. 문의는 관리자 목록의 정렬/필터/범위/개수/1000건 초과/지우기 포함). Supabase 쪽은 `pnpm test:contract` 로 분리 (클라우드 DB/Storage, 테이블과 버킷 RLS, DB 제약, 공개 가입 차단. Auth 계정과 Storage 파일은 실행마다 임시로 만들고 지운다) |
| components | Vitest + Testing Library, Storybook | 렌더, 키보드, aria, 변형별 스토리 |
| 검색 노출 | Vitest, Playwright | 태그/sitemap/robots/301 규칙을 만드는 함수 단위 테스트(301 고리 검사 포함), e2e 로 빌드한 서버의 실제 태그, sitemap, robots, 301 상태와 Location, noindex 헤더 |
| 화면 흐름 | Playwright (CI e2e 잡. 기본은 laptop 하나, 화면 크기에 따라 달라지는 테스트만 `@responsive` 로 세 화면 크기. 기준은 `playwright.config.ts`) | 문의 제출, 관리자 로그인 → 작업 등록(사진 여러 장, 순서, 대표, 공개/비공개, 지우기, 키보드), 문의 처리(제출 → 확인 → 완료 → 다시 열기, 필터와 개수, 두 탭 충돌, 지우기, JS 없이). 납품 확인용 두 흐름은 `@delivery` (`pnpm test:delivery`) |
| 접근성 | Playwright + axe | 공개 ko/en, 관리자 화면과 열린/오류 상태에서 axe 위반 0. 건너뛰기, 포커스 표시, 움직임 멈춤, 320/640px 재배치 (docs/accessibility.md 점검표) |
| 시안 재현 | Playwright + pixelmatch | 390/1440/1920 차이율 |

## 서버/클라이언트 경계
- 기본은 Server Component. 인터랙션이 필요한 말단만 `"use client"` (아코디언, 슬라이더, 폼, 라이트박스, 모바일 메뉴, 띠배너 멈춤)
- 클라이언트 컴포넌트는 `features/*/ui`나 `components/ui`에만 둔다

## 작업 방식
- 칸마다 GitHub 이슈 1개 → 브랜치 `slot/NN-short-name` → PR → CI 통과 후 Rebase and merge
- 커밋 규칙: docs/commit-convention.md
- PR 본문은 템플릿(변경 요약, 스크린샷, 시각 차이율, 테스트, 체크리스트)
- 구조를 바꾸는 결정은 `docs/adr/`에 남긴다
