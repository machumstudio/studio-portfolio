# 0003. 기능 영역만 레이어 분리 + 포트/어댑터
- 상태: 채택 (2026-10)

## 배경
사이트 대부분은 정적 섹션이다. 문의 접수, 작업 관리, 관리자 인증에만 규칙(상태 전이, 검증)과 외부 의존(Supabase, 이메일/Slack)이 있다.

## 결정
- 정적 섹션은 `components/sections`에서 props만 받는 단순 컴포넌트로 둔다
- 기능 영역은 `domain → application → infrastructure`로 나누고, 유스케이스는 포트(인터페이스)에만 의존한다
- 외부 SDK는 `infrastructure`에서만 import한다. 조립은 `infrastructure/container.ts`(server-only)
- 의존 방향은 ESLint로 강제한다 (docs/architecture.md 표)

## 대안
- 모든 곳에 레이어 적용: 정적 페이지에 과한 보일러플레이트
- 컴포넌트에서 Supabase 직접 호출: 빠르지만 테스트와 교체가 어렵고 규칙이 UI에 흩어진다

## 결과
- 유스케이스와 도메인은 인메모리 가짜로 빠르게 테스트된다
- 백엔드를 Supabase에서 다른 것으로 바꿔도 `infrastructure`만 바뀐다
- 파일 수가 늘어난다. 기능 3개 범위에서만 감수한다
