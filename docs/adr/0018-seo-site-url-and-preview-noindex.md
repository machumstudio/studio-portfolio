# 0018. 검색 노출: 주소 기준은 환경 변수, 운영 배포만 색인, 태그는 src/lib/seo 한 곳에서 만든다
- 상태: 채택 (2026-10-25)

## 배경
20칸 전에는 페이지마다 title/description 만 있었다. 공고의 "SEO, 기존 사이트 이전(301)"(docs/requirements.md)을 보여 주려면 canonical, hreflang, OG/X 카드, sitemap, robots, 301 이 필요하다. 정해야 할 것:
- 절대 주소의 기준. 운영 도메인은 22칸 배포 때 정해지고, Vercel 은 배포마다 미리보기 주소가 생긴다
- 미리보기 주소가 검색에 잡히지 않게 하는 방법
- 태그를 어디서 만들지. Next 는 `openGraph` 같은 객체를 상위 레이아웃과 합치지 않고 통째로 바꾼다
- 공유 카드 이미지를 어떻게 만들지 (한글)
- 301 과 Next 의 `permanent: true`(308)

## 결정
- 주소 기준: `NEXT_PUBLIC_SITE_URL` → Vercel 운영이면 `VERCEL_PROJECT_PRODUCTION_URL` → `VERCEL_URL`(미리보기) → `http://localhost:3000` (`src/lib/seo/site.ts readSiteUrl`). `[locale]` 레이아웃의 `metadataBase`, sitemap, robots, 구조화 데이터가 같은 값을 쓴다
- 색인: `VERCEL_ENV=production` 만 색인한다. 그 밖의 배포는 빌드 때 모든 응답(페이지, 사진, sitemap)에 `X-Robots-Tag: noindex, nofollow`(next.config headers) + 페이지에 robots 메타 태그를 붙인다. robots.txt 는 운영과 같게 둔다(`/admin` 차단 + sitemap). robots.txt 로 전체를 막으면 검색엔진이 noindex 를 읽지 못해 바깥 링크만으로 주소가 색인될 수 있다
- 태그: 공개 페이지마다 `pageMetadata`(제목/설명, canonical, ko/en + x-default, OG, X 카드)를 부른다. 레이아웃에는 `metadataBase` 와 robots 만 둔다 (canonical 을 레이아웃에 두면 404 가 홈 canonical 을 물려받는다). hreflang 은 metadata 와 sitemap 이 맡고 next-intl 의 Link 응답 헤더는 끈다 (요청 호스트로 만들어져 canonical 과 어긋난다)
- 공유 카드: 1200x630 JPEG 두 장(ko/en)을 미리 그려 `public/og` 에 둔다 (`pnpm og:image`, Pretendard 로 그린 그림). 작업 상세는 대표 사진이 카드다
- 301: 예전 주소 규칙은 `src/lib/seo/legacy-redirects.ts` 한 곳에 `{ from, to }` 로 쓰고 언어마다 펼친다. `statusCode: 301` 을 직접 준다. 규칙 검사 테스트(도착지가 있는 페이지, 고리/연쇄 없음, 지금 페이지를 가리지 않음)를 둔다
- 작업 sitemap 의 lastmod 는 작업의 `updatedAt`(저장 시각, Clock 에서). sitemap 은 "works" 캐시 태그가 달린 읽기를 써서 저장 액션의 `updateTag("works")` 로 같이 다시 만들어진다

## 대안
- `opengraph-image.tsx`(next/og): 요청 때가 아니라 빌드 때 그려도 한글 글꼴 파일을 실어야 하고, 파일 규칙 메타데이터가 상위 세그먼트에 있으면 작업 상세의 대표 사진 카드와 우선순위를 따져야 한다
- 미리보기도 robots.txt `Disallow: /`: 흔한 방법이지만 위 이유로 noindex 를 막는다. Vercel 도 미리보기 주소에 noindex 헤더를 붙이지만 다른 곳에 배포할 때를 위해 앱이 직접 붙인다
- `permanent: true`(308): 메서드를 보존하지만 공고와 검색엔진 안내 문서가 말하는 301 과 다르다. 예전 주소는 GET 링크라 메서드 보존이 필요 없다
- sitemap 의 고정 페이지 lastmod 를 빌드 시각으로: 배포마다 모든 페이지가 바뀐 것처럼 보여 lastmod 를 믿지 않게 된다. 모르는 값은 비운다

## 결과
- 운영 도메인을 붙이면 `NEXT_PUBLIC_SITE_URL` 하나만 바꾼다. 비워 두면 Vercel 운영 도메인을 쓴다
- 로컬과 CI 빌드는 noindex 다. Lighthouse 를 운영처럼 재려면 `VERCEL_ENV=production` 으로 빌드한다 (docs/performance.md)
- 예전 주소를 더하는 것은 목록에 한 줄. 잘못 넣으면(없는 페이지, 고리) `pnpm test` 가 실패한다
