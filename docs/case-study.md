# 케이스 스터디: 사진 스튜디오 홈페이지 (피그마 시안 → 반응형 웹 + 관리자)

> **이 작업은 직접 기획한 데모입니다. 실제 의뢰인의 작업이 아닙니다.**
> 위시켓의 홈페이지·피그마 구현 외주 공고 7건(2026-10)에서 반복된 요구사항([docs/requirements.md](requirements.md))을 모아 가상의 의뢰를 만들고, 그 의뢰를 처음부터 끝까지 납품한다는 가정으로 진행했습니다.
> 스튜디오 "Machum Studio"는 가상의 이름이고, 디자인은 공개 피그마 템플릿([Produce UI](https://www.figma.com/community/file/1324089527430438614), CC BY 4.0), 사진은 Unsplash 입니다.

- 데모 사이트: **https://machum-studio.vercel.app** (영어 `/en`)
- 소스: 이 레포. 커밋과 PR 순서가 작업 순서 그대로입니다

## 1. 요구사항 (가상 공고)

> 사진 스튜디오 홈페이지 제작을 맡길 개발자를 찾습니다. 디자인은 피그마 시안(PC 1920, 노트북 1440, 모바일 390)으로 준비되어 있고, 태블릿 화면은 시안이 없어 개발자가 맞춰 주셨으면 합니다. 시안과 최대한 똑같이, 사진이 많아도 빠르게 떠야 합니다. 포트폴리오 사진은 저희가 직접 올리고 순서를 바꾸고, 공개 전에는 숨겨 둘 수 있어야 합니다 (개발을 모르는 직원이 씁니다). 문의 폼으로 들어온 문의는 하나도 빠지면 안 되고, 들어오면 바로 메일로 알려 주세요. 관리자 화면에서 문의를 확인/완료로 정리할 수 있으면 좋겠습니다. 지금 쓰는 홈페이지에서 옮기는 것이라 예전 주소로 들어온 손님과 검색 순위가 끊기지 않게 해 주시고, 해외 고객을 위해 영어 페이지도 필요합니다. Next.js 로 만들어 주시고, 납품 뒤에도 저희가 운영하고 다른 개발자에게 넘길 수 있게 사용 설명과 소스 정리를 부탁드립니다. 운영 비용은 가능하면 들지 않았으면 합니다.

## 2. 구현 매핑
요구마다 **무엇을 했나**(개발을 몰라도 읽을 수 있게) / **어디서 보나**(데모 사이트 주소, 스크린샷) / **근거**(코드, 결정 기록 ADR, 테스트)를 적었습니다.
관리자 화면은 로그인이 필요해서 스크린샷으로만 보여 드립니다.

### 2-1. 피그마 시안대로 PC / 태블릿 / 모바일 반응형
- **무엇을 했나**: 시안 3종(모바일 390, 노트북 1440, 데스크톱 1920)의 간격, 글자 크기, 색을 시안 파일의 수치 그대로 옮겼습니다. 색과 글자는 시안의 스타일 이름 그대로 토큰으로 만들어, 시안에 없는 색이나 임의 수치를 쓰면 검사에서 막힙니다. 시안이 없는 768~1439(태블릿과 작은 노트북)는 직접 설계했고, 1024~1439 에서 시안 배치가 들어가지 않는 곳(헤더 메뉴, 푸터, 통계 칸)은 좁은 배치를 따로 두었습니다. 시안에 없는 화면(작업 상세, 관리자, 404)은 시안의 카드/버튼/색만 조합했습니다
- **어디서 보나**: 모든 페이지. 브라우저 폭을 줄여 보면 됩니다. 스크린샷 [홈 1440](screenshots/home-desktop.jpg), [홈 390](screenshots/home-mobile.jpg)
- **근거**
  - 재현도: 화면을 시안 PNG 와 픽셀 비교한 차이율 (아래 "결과 수치"), [ADR 0004](adr/0004-visual-regression-against-figma.md)
  - 토큰: `docs/design/tokens.css`, [ADR 0001](adr/0001-design-tokens-in-tailwind-theme.md). 임의값 금지는 `eslint.config.mjs`
  - 768~1439: [ADR 0011](adr/0011-xl-breakpoint-at-design-laptop-width.md), `e2e/responsive.spec.ts` (768/1024/1180/1280 에서 넘침·겹침·줄 꺾임, ko/en)

### 2-2. 비개발자도 쉬운 관리자 (작업과 사진 관리)
- **무엇을 했나**: 작업(촬영 건)을 만들고 사진을 끌어다 놓아 여러 장 올립니다. 큰 원본도 브라우저가 알맞은 크기로 줄여서 올리고, 이때 촬영 위치 같은 사진 정보가 지워집니다. 순서는 끌어서 바꾸거나 앞/뒤 버튼으로, 대표 사진은 버튼 하나로 정합니다. 공개/비공개를 고르고 저장하면 공개 화면에 바로 반영되고, "공개 화면" 링크로 실제 화면을 확인합니다. 지우기는 확인 단계를 거칩니다
- **어디서 보나**: 스크린샷 [작업 목록](screenshots/admin-works.jpg), [사진 편집](screenshots/admin-work-edit.jpg). 사용법은 [운영 매뉴얼 2장](ops-manual.md#2-작업포트폴리오-관리)
- **근거**
  - 코드: `src/features/works/ui/WorkEditor.tsx`, `src/application/works/save-work.ts`, 사진 순서와 대표 규칙 `src/domain/works/images.ts`
  - 결정: 사진은 브라우저에서 저장소로 직접 올림 [ADR 0014](adr/0014-work-photos-public-bucket.md), 편집 화면 상태 관리 [ADR 0015](adr/0015-admin-editor-requires-js.md), 관리자만 쓰기 [ADR 0012](adr/0012-admin-data-access-via-rls.md)
  - 테스트: `WorkEditor.test.tsx`, `e2e/admin-works.spec.ts` (사진 등록 → 공개 → 포트폴리오/sitemap 반영, 키보드만으로 순서 바꾸기), 계약 테스트로 관리자 아닌 세션의 쓰기 차단

### 2-3. 문의 누락 없이 접수 + 관리자 즉시 알림
- **무엇을 했나**
  - **저장이 먼저입니다.** 문의는 데이터베이스에 저장된 뒤에 알림 메일을 보냅니다. 메일 서비스가 실패하거나 5초 안에 답하지 않아도 문의는 저장된 채 "접수 완료"가 되고, 서버에는 경고만 남습니다. 놓친 알림은 관리자 목록의 "새 문의"에 그대로 있습니다
  - 저장 자체가 실패하면 손님에게 다시 보내 달라고 알리고, 쓴 내용은 지우지 않습니다. 없는 문의를 알리는 메일도 보내지 않습니다
  - 알림 메일은 이름, 연락처, 메시지, 접수 시각이 담기고 "답장"을 누르면 문의자에게 바로 갑니다
  - 관리자 화면에서 새 문의 → 확인 → 완료로 상태를 바꿉니다. 열어 보기만 해서는 바뀌지 않아 실수로 연 문의가 "새 문의"에서 사라지지 않습니다. 다른 기기에서 먼저 바꿨으면 알려 줍니다
- **어디서 보나**: 문의 폼 https://machum-studio.vercel.app/contact , 스크린샷 [문의 목록](screenshots/admin-inquiries.jpg), [문의 상세](screenshots/admin-inquiry.jpg)
- **근거**
  - 코드: `src/application/inquiry/submit-inquiry.ts`(저장 → 알림 순서, 실패 처리), `src/domain/inquiry/status.ts`(상태 전이표), `src/infrastructure/inquiry/resend-notifier.ts`
  - 결정: [ADR 0007](adr/0007-inquiry-notification-failure-is-warning.md) 알림 실패는 경고, [ADR 0008](adr/0008-inquiry-status-changed-at.md) 상태별 시각, [ADR 0016](adr/0016-admin-inquiries-url-state-and-post-redirect.md) 열어도 자동 확인하지 않음
  - 테스트: `submit-inquiry.test.ts`(알림 실패 → 저장 유지 + 경고, 저장 실패 → 알림 없음), `status.test.ts`(전이표 전체), `e2e/admin-inquiries.spec.ts`(방문자 문의 → 관리자 처리, 납품 확인 흐름)

### 2-4. 이미지 많은 사이트의 속도
- **무엇을 했나**: 사진은 화면 크기에 맞는 크기와 형식(WebP)으로 자동 변환되어 나가고, 첫 화면 사진만 먼저 받고 나머지는 스크롤할 때 받습니다. 사진 칸 자리를 미리 잡아 내려받는 중에 화면이 밀리지 않습니다
- **어디서 보나**: 아래 Lighthouse 표. 다시 재는 방법은 [docs/performance.md](performance.md)
- **근거**: `next/image`, `e2e/layout-shift.spec.ts`(6페이지 × 3화면에서 레이아웃 이동 0.01 미만), 한글 글꼴 비용 [ADR 0017](adr/0017-keep-pretendard-and-its-cost.md), 이미지 형식과 캐시 [ADR 0021](adr/0021-free-tier-operations.md)

### 2-5. SEO, 기존 사이트 이전(301)
- **무엇을 했나**: 페이지마다 검색 제목/설명, 공유 카드(카카오톡·SNS 미리보기 이미지), 한/영 페이지 연결, sitemap, robots 를 넣었습니다. 예전 사이트 주소는 새 주소로 301 영구 이동합니다. 운영자가 목록에 한 줄을 더하면 되고, 도착지가 없거나 이동이 꼬이면 테스트가 실패합니다. 미리보기 배포는 검색에 잡히지 않게 막았습니다
- **어디서 보나**: https://machum-studio.vercel.app/sitemap.xml , 예전 주소 예시 https://machum-studio.vercel.app/gallery/a-wedding-tale → `/work/a-wedding-tale` (301)
- **근거**: `src/lib/seo/legacy-redirects.ts` + `legacy-redirects.test.ts`, `src/lib/seo/metadata.ts`, [ADR 0018](adr/0018-seo-site-url-and-preview-noindex.md), `e2e/seo.spec.ts`

### 2-6. Next.js
- **무엇을 했나**: Next.js 16(App Router), TypeScript strict. 화면 데이터는 서버에서 그리고 미리 만든 화면을 캐시합니다. 문의 폼은 JS 가 꺼져 있어도 제출됩니다
- **근거**: [docs/architecture.md](architecture.md) (레이어와 의존 규칙. 규칙을 어기면 lint 와 CI 가 실패), [ADR 0003](adr/0003-layered-architecture-ports-and-adapters.md)

### 2-7. 다국어
- **무엇을 했나**: 한국어(기본, 주소 그대로)와 영어(`/en`). 화면 문구는 처음부터 번역 파일로 관리해, 영어 문구가 길어져도 깨지지 않는지 따로 검사합니다. 관리자 화면은 한국어만 둡니다
- **어디서 보나**: https://machum-studio.vercel.app/en
- **근거**: `messages/ko.json`, `messages/en.json`, [ADR 0002](adr/0002-i18n-routing.md), [ADR 0013](adr/0013-admin-routes-ko-only-and-static-login.md), `e2e/en-layout.spec.ts`

### 2-8. 가독성 / 접근성
- **무엇을 했나**: 목표는 WCAG 2.2 AA. 자동 검사(axe) 위반 0, 마우스 없이 키보드만으로 주요 기능(메뉴, 슬라이더, 사진 크게 보기, FAQ, 문의 폼, 관리자 사진 순서와 문의 처리), 글자 명도 대비 AA. 시안의 회색 글자 하나가 대비 기준에 못 미쳐 시안 팔레트 안의 한 단계 밝은 회색으로 바꿨습니다. 건너뛰기 링크, 움직이는 띠배너 멈추기, 화면 400% 확대에서 가로 넘침 없음까지 확인했습니다
- **어디서 보나**: 아무 페이지에서 Tab 키. 점검표는 [docs/accessibility.md](accessibility.md)
- **근거**: `e2e/a11y.spec.ts`(axe), `e2e/a11y-keyboard.spec.ts`, 점검표 17항목과 각 항목의 테스트

### 2-9. 소스 인수인계와 운영 매뉴얼
- **무엇을 했나**: 운영자용 사용 설명(로그인, 작업/사진, 문의, 알림 메일, 서비스 한도, 자주 묻는 문제)과 개발자용 인수인계(구성, 환경 변수, 배포 흐름, DB 변경 적용, 키 교체)를 한 문서에 나눠 적었습니다. 구조를 바꾼 이유는 결정 기록(ADR) 21개로 남겼고, 납품 확인용 핵심 흐름 2개를 명령 하나(`pnpm test:delivery`)로 돌릴 수 있습니다
- **어디서 보나**: [docs/ops-manual.md](ops-manual.md), [README](../README.md), [ADR 목록](adr/README.md)
- **근거**: PR 마다 이슈 → 브랜치 → CI(lint, 타입, 단위, e2e, DB 계약 테스트) → 머지 ([ADR 0005](adr/0005-issue-pr-ci-workflow.md))

### 2-10. 무료 플랜 운영
- **무엇을 했나**: Vercel(사이트), Supabase(DB/로그인/사진 저장), Resend(메일) 무료 플랜만으로 운영합니다. Supabase 무료 프로젝트가 7일 동안 쓰이지 않으면 멈추는 문제는 매일 새벽 한 번 사이트가 스스로 DB 를 읽어 막습니다(keepalive). 사진 변환 한도(월 5,000회)는 형식을 WebP 하나로 두고 캐시를 7일로 늘려 지금 사진 기준 약 6%만 씁니다. 한도를 넘으면 어떻게 되는지와 멈췄을 때 되살리는 법은 운영 매뉴얼에 있습니다
- **어디서 보나**: [운영 매뉴얼 5장 서비스 한도](ops-manual.md#5-서비스-한도-무료-플랜)
- **근거**: `src/app/api/keepalive/route.ts`, `vercel.json`(cron), [ADR 0021](adr/0021-free-tier-operations.md)

## 3. 결과 수치

### Lighthouse (운영 주소, 2026-10-25)
| 페이지 | 모바일 성능 | 데스크톱 성능 | 접근성 | 권장사항 | SEO |
|---|---|---|---|---|---|
| 홈 | 99 | 100 | 100 | 100 | 100 |
| 포트폴리오 | 98 | 100 | 100 | 100 | 100 |
| 작업 상세 | 97 | 100 | 100 | 100 | 100 |
| 소개 | 98 | 100 | 100 | 100 | 100 |
| 서비스 | 98 | 100 | 100 | 100 | 100 |
| 문의 | 98 | 100 | 100 | 100 | 100 |

이 표는 개발 PC(Apple M5)에서 Lighthouse CLI 로 운영 주소를 잰 값입니다.
성능은 3회 중앙값. 모바일은 Lighthouse 기본(느린 4G, CPU 4배 감속). 측정 조건과 회차별 값은 [README](../README.md#lighthouse), [docs/performance.md](performance.md).

### PageSpeed Insights (구글 서버, 모바일, 2026-10-25)
| 페이지 | 모바일 성능 | 접근성 | 권장사항 | SEO |
|---|---|---|---|---|
| 홈 | 78 (81/78/78 중앙값) | 100 | 100 | 100 |
| 포트폴리오 | 81 (1회) | 100 | 100 | 100 |

- Lighthouse 13.5.0. 실사용자 데이터(CrUX)는 방문자가 적어 없습니다
- 의뢰인이 직접 재현할 수 있는 기준은 이 값입니다: https://pagespeed.web.dev 에 운영 주소를 넣으면 됩니다
- 위 CLI 표(97~99)보다 낮은 것은 측정 위치와 기기 차이로 보입니다 (원인 미확인)

### 시안 재현도 (시안 PNG 와의 픽셀 차이율, 낮을수록 같음)
| 페이지 | 모바일 390 | 노트북 1440 | 데스크톱 1920 |
|---|---|---|---|
| 홈 | 7.22% | 4.26% | 3.11% |
| 포트폴리오 | 10.19% | 3.80% | 2.91% |
| 소개 | 16.28% | 8.83% | 8.16% |
| 서비스 | 13.32% | 3.30% | 3.16% |
| 문의 | 10.10% | 6.14% | 5.45% |

범위: 노트북·데스크톱 2.91~8.83%(약 3~9%), 모바일 7.22~16.28%(약 7~16%). 시안은 영어, 비교 화면은 한국어라 글자 모양과 줄 수가 달라 아래 섹션이 밀리는 만큼이 대부분입니다 (좁은 모바일에서 크게 나타남). 사진 영역은 양쪽 모두 가리고 비교했습니다. 접근성 때문에 바꾼 회색과 포트폴리오 필터도 차이에 들어 있습니다.

### 테스트와 검사
| 항목 | 수 |
|---|---|
| 단위/컴포넌트 테스트 (Vitest) | 887개 (107파일) |
| e2e (Playwright, 실제 브라우저) | 169개, 화면 크기에 따라 달라지는 것은 390/1440/1920 세 번 돌아 291회 |
| DB 계약 테스트 (실제 Supabase, 권한·제약 포함) | 112개 (8파일) |
| 시안 비교 | 5페이지 × 3화면 = 15장 |
| 접근성 자동 검사 (axe) | 63개 검사, 위반 0. 공개 6페이지 + 404(ko/en)와 관리자 6화면, 메뉴/FAQ/사진 확대/확인 창/오류 상태까지, 390/1440/1920 |
| 접근성 수동 점검 | 17항목 (키보드, 포커스, 확대 400%, 움직임 등) |

PR 마다 CI 가 lint, 타입 검사, 단위 테스트, 빌드, DB 계약 테스트를 돌리고, 코드가 바뀐 PR 은 e2e(axe 포함)까지 돌립니다. 문서만 바뀐 PR 은 e2e 를 건너뜁니다.

### 기간과 비용
- 기간: 2026-10-21 ~ 2026-10-25, 작업표 23칸 (02칸부터 칸마다 이슈와 PR. 이 문서까지 PR 23개, 커밋 약 260개)
- 운영 비용: **월 0원** (Vercel Hobby, Supabase Free, Resend Free). 단, Vercel Hobby 는 비상업용이라 실제 영업 사이트라면 Vercel Pro(유료)로 바꿔야 합니다 ([운영 매뉴얼 5장](ops-manual.md#5-서비스-한도-무료-플랜))

## 4. 데모 사이트
| 화면 | 주소 |
|---|---|
| 홈 | https://machum-studio.vercel.app |
| 포트폴리오 | https://machum-studio.vercel.app/portfolio |
| 작업 상세 | https://machum-studio.vercel.app/work/a-wedding-tale |
| 문의 | https://machum-studio.vercel.app/contact |
| 영어 | https://machum-studio.vercel.app/en |
| 관리자 | 로그인 필요. 스크린샷: [작업 목록](screenshots/admin-works.jpg), [사진 편집](screenshots/admin-work-edit.jpg), [문의 목록](screenshots/admin-inquiries.jpg), [문의 상세](screenshots/admin-inquiry.jpg) |

## 5. 판단 기록
- **문의 알림이 실패해도 저장은 유지한다** ([ADR 0007](adr/0007-inquiry-notification-failure-is-warning.md)): 스튜디오에 가장 나쁜 일은 문의를 잃는 것입니다. 알림을 놓쳐도 관리자 목록에 남으니, 메일 장애가 문의 접수 장애가 되지 않게 했습니다. 대신 알림 재시도 장치는 두지 않았고(하루 몇 건에 비해 과함), 운영자가 "새 문의"를 확인하는 것이 그 역할입니다
- **한글 글꼴 Pretendard 를 유지하고 비용을 받아들인다** ([ADR 0017](adr/0017-keep-pretendard-and-its-cost.md)): OS 기본 글꼴로 바꾸면 모바일 성능 점수가 안정되고 첫 방문 약 440KB 를 아끼지만, 윈도에서 맑은 고딕으로 보여 기기마다 모양이 달라집니다. 같은 모양을 택했고, 점수가 회차에 따라 흔들리는 것은 숨기지 않고 기록했습니다. 성능이 더 중요한 의뢰라면 한 줄로 되돌릴 수 있습니다
- **관리자 사진 편집 화면은 JS 를 전제로 한다** ([ADR 0015](adr/0015-admin-editor-requires-js.md)): 큰 원본 사진을 서버를 거치지 않고 브라우저에서 줄여 올려야 업로드 한도에 걸리지 않습니다. 관리자는 최신 브라우저를 쓰는 소수라 받아들였고, 상태 관리 라이브러리도 넣지 않았습니다. 문의 폼과 문의 상태 바꾸기는 JS 없이도 됩니다
- **e2e 를 화면 크기에 따라 나눠 돌린다** (`playwright.config.ts` 주석): 화면 크기와 상관없는 흐름(문의 처리, 관리자, SEO 응답)은 1440 한 번, 레이아웃·접근성·시안 비교만 390/1440/1920 세 번 돕니다. 모든 테스트를 세 화면에서 돌리던 것을 나눠 실행 수를 507 → 291 로 줄였고(CI e2e 가 7분 넘게 걸리던 것), 화면 크기에 따라 달라지는 검사는 그대로 세 화면에서 봅니다
- **Supabase 일시정지는 GitHub Actions 가 아니라 Vercel cron 으로 막는다** ([ADR 0021](adr/0021-free-tier-operations.md)): GitHub 예약 작업은 레포가 60일 조용하면 꺼집니다. 납품 뒤 조용해질수록 위험해지는 방법이라 사이트 자신이 매일 DB 를 읽게 했습니다

---

## 포트폴리오 등록용

**제목**
[자체 데모] 사진 스튜디오 홈페이지: 피그마 반응형 + 관리자

**한 줄 소개**
개발을 모르는 직원도 사진과 문의를 직접 관리할 수 있는 사진 스튜디오 홈페이지입니다. 피그마 시안 구현부터 배포까지 혼자 만든 자체 데모입니다.

**본문 요약**
외주 공고에서 반복되는 요구로 가상의 사진 스튜디오 의뢰를 직접 기획해, 기획부터 배포까지 혼자 진행한 데모입니다. 실제 의뢰인 작업은 아닙니다.
- 반응형: 피그마 시안 3종(데스크톱·노트북·모바일)의 간격·글자·색을 기준으로 구현하고, 시안에 없는 태블릿·작은 노트북(768~1439) 화면은 직접 설계했습니다. 시안과 픽셀 단위로 비교한 차이율을 공개합니다(노트북·데스크톱 3~9%, 모바일은 한국어 문장 길이 차이로 7~16%).
- 관리자: 사진을 끌어다 놓아 올리고 순서와 대표 사진을 정한 뒤 공개로 바꾸면 사이트에 바로 반영됩니다. 들어온 문의는 '새 문의 → 확인 → 완료'로 정리합니다.
- 문의 보호: 문의를 먼저 저장한 뒤 알림 메일을 보내서, 메일이 실패해도 문의는 남습니다.
- 속도와 검색: Lighthouse 모바일 성능 97~99, 접근성·SEO 100(2026-10-25, 페이지별 3회 중앙값). 예전 주소로 들어와도 새 페이지로 이어지고(301), 한/영 두 언어를 지원합니다.
- 접근성: 메뉴·슬라이더·문의 폼·관리자까지 주요 기능을 키보드만으로 쓸 수 있고, 자동 검사 위반 0, 글자 명도 대비 AA입니다.
- 품질과 인수인계: 코드를 고칠 때마다 자동 테스트 약 1,170개가 돌아 기존 기능이 깨지지 않게 했습니다. 운영자용 사용 설명서, 개발자 인수인계 문서, 결정 기록 21개를 남겼습니다.
- 운영 비용: 데모는 Vercel·Supabase·Resend 무료 플랜으로 월 0원입니다. 실제 영업 사이트라면 Vercel 유료 플랜(월 $20부터)이 필요합니다. 무료 DB의 7일 비활성 정지는 매일 자동으로 막습니다.

디자인: Produce UI 피그마 템플릿(CC BY 4.0) · 사진: Unsplash
데모 사이트: https://machum-studio.vercel.app

**기술 태그**
Next.js, React, TypeScript, Tailwind CSS, Supabase, PostgreSQL, next-intl, Vitest, Playwright, Storybook, Vercel, GitHub Actions, Figma, 반응형 웹, 웹 접근성, SEO

**기간**
2026-10-21 ~ 2026-10-25

**역할**
기획 · 디자인 구현 · 개발 · 배포 (1인)

**대표 이미지 추천 (3장)**
1. [docs/screenshots/home-desktop.jpg](screenshots/home-desktop.jpg): 첫인상. 시안을 옮긴 홈 1440
2. [docs/screenshots/admin-work-edit.jpg](screenshots/admin-work-edit.jpg): 관리자 사진 편집 (업로드, 순서, 대표). "운영할 수 있다"는 증거
3. [docs/screenshots/home-mobile.jpg](screenshots/home-mobile.jpg): 같은 페이지의 모바일 390. 1번과 나란히 두면 반응형이 바로 보입니다
