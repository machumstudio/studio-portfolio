# studio-portfolio

Figma 시안(Produce UI, CC BY 4.0)을 반응형 웹 + 간단한 관리자로 구현한 포트폴리오 데모.
목적은 외주 클라이언트에게 "피그마 시안을 PC/태블릿/모바일에서 그대로, 빠르게, 운영 가능하게 만든다"는 증거를 보여주는 것이다.

## 스택
Next.js (App Router) · TypeScript strict · Tailwind CSS v4 · TanStack Query(관리자 데이터) · Zustand(UI 상태) · react-hook-form + zod · Supabase(Auth/DB/Storage) · next-intl(ko/en) · Vitest · Playwright · Storybook · Vercel

## 아키텍처와 작업 방식 (먼저 읽기)
- `docs/architecture.md`: 레이어, 의존 규칙 표, 도메인 모델링 규칙, 데이터 흐름, 테스트 전략
- `docs/adr/`: 결정 기록. 구조를 바꾸면 ADR을 추가한다
- 칸마다 이슈 → 브랜치 `slot/NN-name` → PR(템플릿) → CI → Rebase and merge
- 커밋은 `docs/commit-convention.md`를 따른다: `type(scope): 한국어 요약`, 커밋 1개 = 논리 변경 1개, 모든 커밋이 lint/typecheck/test 통과, 기능은 domain → application → infra → features → pages 순서로 커밋. 규칙을 지키면 확인 없이 커밋한다 (main 직접 커밋/푸시, force push 금지). 이슈 연결은 PR 본문 `Closes #N`. 칸 시작에 이슈, 칸 끝에 PR을 직접 만들고 CI까지 확인한다 (머지는 사람이). 절차는 docs/commit-convention.md "이슈와 PR"
- 정적 섹션은 단순하게(props만), 레이어는 기능 영역(works, inquiry, admin-auth)에만

## 디자인 소스 (반드시 여기서 수치를 가져온다)
- `docs/design/figma-spec.md`: 페이지/섹션/공통 컴포넌트/그리드/타이포 요약, 노드 JSON 읽는 법
- `docs/design/nodes/<page>-<desktop|laptop|mobile>.json`: Figma 노드 트리 (레이아웃, 간격, 패딩, 색 스타일명, 텍스트 크기/굵기/행간)
- `docs/design/reference/*.png`: 시안 원본 이미지 (1x). 시각 비교 기준
- `docs/design/tokens.css`: 색/브레이크포인트/타이포 토큰. `globals.css`에 넣어서 쓴다
- 추측하지 않는다. 수치는 노드 JSON에서 읽고, 애매하면 reference 이미지를 열어 확인한다

## 규칙
1. 색은 토큰만 쓴다 (`bg-dark-06`, `text-grey-70`, `bg-purple-55` 등). 임의 hex, `bg-[#...]` 금지
2. 글자는 `text-display/price/h1/h2/h3/lead/body` 유틸리티를 우선 쓴다. 노드 값과 다르면 토큰을 고치고 이유를 커밋에 적는다
3. 브레이크포인트: 기본=모바일(시안 390) → `md` 768 태블릿(시안 없음, 직접 설계) → `lg` 1024~ 노트북(시안 1440) → `3xl` 1920~ 데스크톱(시안 1920)
4. 좌우 여백은 `page-x` 유틸리티. 섹션 간격은 노드 JSON의 gap/pad 값
5. 섹션 하나 = 컴포넌트 하나 (`src/components/sections/<Page><Section>.tsx`) + Storybook 스토리. 공통 UI는 `src/components/ui/`. 섹션은 데이터를 직접 가져오지 않고 props로 받는다
6. 이미지는 `next/image`. 시안 사진은 쓰지 않고 Unsplash 사진으로 교체, 출처는 `CREDITS.md`
7. 이름/문구는 가상 스튜디오 "Machum Studio"로 바꾼다. 시안의 "Damien Braun" 사용 금지
8. 아이콘은 `lucide-react`로 시안과 가장 가까운 것을 쓴다. 예외: 브랜드 아이콘(Instagram, Facebook, X 등)은 lucide 에 없어 `simple-icons`(CC0)의 path 를 쓴다
9. 접근성: 시맨틱 태그, 키보드로 모든 인터랙션 가능, 아코디언/메뉴/라이트박스는 ARIA 패턴, 명도 대비 확인
10. 텍스트는 처음부터 next-intl 메시지 키로 (`messages/ko.json`, `messages/en.json`)
11. 시안에 없는 화면(태블릿, 작업 상세, 관리자, 404)은 기존 카드/버튼/색 토큰만 조합해서 만든다

## 검증 (작업 끝날 때마다)
- `pnpm lint && pnpm typecheck && pnpm test`
- 시각 비교: `pnpm test:visual` (Playwright로 390/1440/1920 스크린샷 → `docs/design/reference`와 픽셀 비교, 사진 영역은 mask). 차이율을 PR/커밋 메시지에 적는다
- Lighthouse(모바일) 성능/접근성/SEO 90 이상 목표, 결과는 README 표에 갱신

## 금지
- 개인정보, 실명, 이메일, 전화번호, 다른 회사/프로젝트 코드나 문서를 넣지 않는다
- `.env*`, Supabase 키 커밋 금지 (`.env.example`만)
- 맨 `gh` 명령 금지 (전역 로그인이 다른 계정). 반드시 `bash scripts/gh.sh ...` 로만 쓴다. 이 스크립트가 machumstudio 계정이 아니면 중단한다

## 크레딧
푸터와 README에 "Design by Produce UI (CC BY 4.0)" + 원본 링크
