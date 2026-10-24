# infrastructure
포트 구현(Supabase, 이메일, Slack)과 조립(`container.ts`). server-only. 외부 SDK 는 여기서만 import 한다.

- `container.ts`: env 가 있으면 Supabase, 없거나 `DATA_STORE=memory` 면 인메모리. 관리자 인증만은 env 가 없으면 꺼진다 (`admin-auth/mode.ts`)
- `admin-auth/`: 관리자 세션(쿠키). Supabase Auth(@supabase/ssr), 인메모리 테스트 계정, proxy 의 빠른 확인
- `supabase/`: 서버 클라이언트(secret 키), 테이블 타입, 계약 테스트 지원
- `<context>/supabase-*-mapper.ts`: 행 ↔ 도메인 모양 변환 (규칙은 domain 생성자, docs/adr/0010)
