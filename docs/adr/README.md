# ADR (Architecture Decision Records)
| # | 제목 | 상태 |
|---|---|---|
| [0001](0001-design-tokens-in-tailwind-theme.md) | 디자인 토큰을 Tailwind `@theme`에 Figma 스타일 이름 그대로 둔다 | 채택 |
| [0002](0002-i18n-routing.md) | next-intl, 한국어 기본(접두사 없음) + 언어 감지 끔 | 채택 |
| [0003](0003-layered-architecture-ports-and-adapters.md) | 기능 영역만 레이어 분리 + 포트/어댑터 | 채택 |
| [0004](0004-visual-regression-against-figma.md) | Figma 시안과 픽셀 비교로 재현도 측정 | 채택 |
| [0005](0005-issue-pr-ci-workflow.md) | 칸 단위 이슈 → PR → CI, Rebase and merge | 채택 |
| [0006](0006-site-route-group.md) | 공개 사이트 공통 틀(Header/Footer/CTA)은 `(site)` 라우트 그룹 레이아웃 | 채택 |
| [0007](0007-inquiry-notification-failure-is-warning.md) | 문의 알림이 실패해도 저장은 유지하고 경고로 돌려준다 | 채택 |
| [0008](0008-inquiry-status-changed-at.md) | 문의 상태에 그 상태가 된 시각을 남긴다 (이력은 남기지 않는다) | 채택 |
| [0009](0009-inquiry-validation-single-source.md) | 문의 입력 검증은 domain 한 곳에서만 하고, 폼은 서버 액션 결과로 오류를 그린다 | 채택 |
| [0010](0010-restore-from-storage-via-domain.md) | 저장된 행은 domain 복원 생성자로 되살리고, 인프라 매퍼는 칼럼 변환만 한다 | 채택 |
| [0011](0011-xl-breakpoint-at-design-laptop-width.md) | xl 브레이크포인트를 시안 노트북 프레임 폭 1440 으로 둔다 | 채택 |
| [0012](0012-admin-data-access-via-rls.md) | 관리자 화면은 로그인 세션(authenticated) + RLS `role=admin` 정책으로 테이블을 쓴다 | 채택 |
| [0013](0013-admin-routes-ko-only-and-static-login.md) | 관리자 화면은 언어 접두사 없는 `/admin`(한국어만)에 따로 두고, 로그인 화면은 완전 정적으로 둔다 | 채택 |
| [0014](0014-work-photos-public-bucket.md) | 작업 사진은 Supabase Storage 공개 버킷에 두고, 브라우저가 서명 업로드 주소로 직접 올린다 | 채택 |
| [0015](0015-admin-editor-requires-js.md) | 관리자 편집 화면은 JS 를 전제로 하고, 상태는 서버 컴포넌트 + 서버 액션 + useReducer 로 둔다 (TanStack Query, Zustand 없음) | 채택 |

형식: 배경 / 결정 / 대안 / 결과(트레이드오프). 바꾸면 새 ADR을 쓰고 이전 것을 "대체됨"으로 표시한다.
