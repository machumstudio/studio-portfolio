# 성능과 Lighthouse

README(22칸)에 옮겨 쓸 측정 기록. 다시 재려면 아래 "측정 방법" 그대로 `pnpm lighthouse` 를 돌린다.

## 결과 (2026-10-25, 20칸)
목표: 성능 90+, 접근성/권장사항/SEO 95+. 모두 달성 (접근성 96 의 감점은 아래 "남긴 것").

| 화면 | 페이지 | 성능 | 접근성 | 권장사항 | SEO | LCP | CLS | TBT | FCP |
|---|---|---|---|---|---|---|---|---|---|
| 모바일 | 홈 `/` | 96 | 96 | 100 | 100 | 2.9s | 0.000 | 11ms | 1.1s |
| 모바일 | 포트폴리오 `/portfolio` | 98 | 96 | 100 | 100 | 2.4s | 0.000 | 14ms | 1.2s |
| 모바일 | 작업 상세 `/work/a-wedding-tale` | 98 | 96 | 100 | 100 | 2.4s | 0.000 | 10ms | 0.9s |
| 모바일 | 소개 `/about` | 99 | 96 | 100 | 100 | 2.1s | 0.000 | 11ms | 0.9s |
| 모바일 | 서비스 `/services` | 98 | 96 | 100 | 100 | 2.4s | 0.000 | 10ms | 1.1s |
| 모바일 | 문의 `/contact` | 99 | 96 | 100 | 100 | 2.3s | 0.000 | 9ms | 0.9s |
| 데스크톱 | 홈 `/` | 100 | 96 | 100 | 100 | 0.6s | 0.000 | 0ms | 0.3s |
| 데스크톱 | 포트폴리오 `/portfolio` | 100 | 96 | 100 | 100 | 0.6s | 0.000 | 0ms | 0.3s |
| 데스크톱 | 작업 상세 `/work/a-wedding-tale` | 100 | 96 | 100 | 100 | 0.7s | 0.000 | 0ms | 0.2s |
| 데스크톱 | 소개 `/about` | 100 | 96 | 100 | 100 | 0.6s | 0.000 | 0ms | 0.2s |
| 데스크톱 | 서비스 `/services` | 100 | 96 | 100 | 100 | 0.6s | 0.000 | 0ms | 0.3s |
| 데스크톱 | 문의 `/contact` | 100 | 96 | 100 | 100 | 0.6s | 0.000 | 0ms | 0.2s |

### 측정 조건
- 날짜 2026-10-25, Lighthouse 13.5.0, Headless Chrome 156 (Playwright Chromium), Apple M5 / macOS 26.6 (CPU benchmarkIndex 약 4400)
- 모바일: Lighthouse 기본 (412x823, DPR 1.75, 느린 4G 시뮬레이션 RTT 150ms·1.6Mbps, CPU 4배 감속). 데스크톱: Lighthouse desktop 설정
- 서버: 로컬 운영 빌드 `VERCEL_ENV=production pnpm build && pnpm start` (색인 허용 상태. 미리보기처럼 noindex 면 SEO 점수가 떨어진다). 저장소는 실제 개발 DB(Supabase, `DATA_STORE=memory` 아님), 시드 작업 9개
- 페이지·화면마다 4번 재고 첫 회는 버린 뒤 3회 중앙값. 첫 회는 서버가 사진 크기별 최적화(`/_next/image`)를 처음 만드는 회차라 느리다 (모바일 성능 66~83 으로 나온다). 운영(Vercel)은 최적화한 사진을 캐시하므로 두 번째 방문부터가 실제에 가깝다
- 실제 배포(CDN, 원격 DB)와 숫자가 다를 수 있다. 22칸 배포 뒤 운영 주소로 다시 잰다

## 측정 방법
```bash
VERCEL_ENV=production pnpm build
VERCEL_ENV=production pnpm start          # http://localhost:3000
pnpm lighthouse                           # 다른 터미널. --runs 5, --base http://..., --json 파일
```
스크립트: `scripts/lighthouse.mjs` (페이지 6개 × 모바일/데스크톱, 회차 중앙값, 성능 외 감점 항목과 LCP 요소 출력).
CI 에는 넣지 않았다: GitHub 러너는 CPU 를 나눠 써서 점수가 흔들려 합격선으로 쓰기 어렵고, 운영 빌드 + 서버 + 12개 화면 × 4회로 CI 가 10분 이상 늘어난다. CI 빌드는 인메모리 저장소라 실제 데이터와도 다르다.

## 20칸에서 고친 것
| 무엇 | 전 | 후 |
|---|---|---|
| 첫 화면 LCP 사진: preload → `loading="eager"` + `fetchPriority="high"` | Next 의 preload `<link>` 가 Low 우선순위로 나감 | High. 작업 상세 모바일 LCP 4.1s → 2.4s |
| 홈 콜라주 칸별 `sizes` | 7칸이 같은 41vw → 38px 칸도 384~750px 사진 | 칸 폭 = (화면 폭 - page-x) × 칸 비율 |

확인만 한 것
- 그 밖의 사진(갤러리, 카드, 슬라이더, 라이트박스)은 `loading="lazy"`, `sizes` 는 390/768/1024/1440/1920 에서 렌더 폭과 srcset 선택이 한 단계 안
- Supabase Storage 사진도 최적화를 탄다: `next.config.ts` 의 `remotePatterns` 가 `work-photos` 공개 버킷 경로만 허용. 임시로 올린 사진(418KB JPEG)이 `/_next/image?w=640` 으로 WebP 42KB(WebP 를 받지 않는 브라우저는 JPEG 60KB). 다른 버킷 경로는 400
- 글꼴 preload: Manrope 라틴(24KB)은 next/font 가 응답 `Link` 헤더로 미리 받는다. 다른 글꼴은 받지 않는다
- 레이아웃 이동: 띠배너(마키)와 슬라이더, 사진 칸 모두 자리를 미리 잡아 CLS 0.000. `e2e/layout-shift.spec.ts` 가 6개 페이지 × 3개 화면에서 0.01 미만인지 본다

## 남긴 것
- 접근성 96: `color-contrast`. 시안의 Grey/40(#62646c) 글자(히어로 태그라인, 후기 "전체 리뷰" 등)가 배경 Dark/03 에서 3.41:1 로 4.5:1 에 못 미친다. 시안 색을 바꾸는 일이라 21칸(접근성 점검)에서 토큰과 함께 정한다
- 이미지 형식은 WebP 만 (AVIF 를 켜면 더 작아지지만 Vercel 무료 범위의 이미지 변환 횟수를 형식마다 쓴다). 22칸 배포 뒤 사용량을 보고 정한다
