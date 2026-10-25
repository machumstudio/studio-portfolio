# 0023. Manrope 는 레포 안 글꼴 파일로 쓴다 (빌드가 Google Fonts 에 기대지 않게)
- 상태: 채택 (2026-10-25)

## 배경
Manrope 는 `next/font/google` 으로 넣었다. 이 방식은 빌드할 때 Next 가 Google Fonts 에서 CSS 와 woff2 를 받아 `.next/static/media` 에 넣는다. 즉 빌드 결과가 그때 Google 이 주는 응답에 달려 있다.

사고 경위 (2026-10-25):
- PR #48(sm 브레이크포인트 640 → 560) 머지 뒤 운영 배포의 CSS 에 `--breakpoint-sm:40rem`(옛 값)이 들어갔다
- 빌드 캐시 없이 다시 배포하면 빌드가 실패했다: `Error while looking up import map: next/font/google queries have exactly one entry` (Manrope, `NextFontGoogleFontFileReplacer`)
- 로컬 dev 서버도 같은 오류로 500 을 낸 적이 있고, 그때 Turbopack 캐시에 `fonts.gstatic.com/l/font?kit=...&skey=...` 형식의 글꼴 주소가 들어 있었다. 평소 Google 은 `fonts.gstatic.com/s/manrope/v20/....woff2` 형식을 준다 (같은 날 다시 받아 봤을 때도 이 형식이었다)
- 추정 (확인하지 못함): Google 이 가끔 주는 `/l/font?kit=` 형식 주소(물음표 뒤 항목이 여러 개)를 Turbopack 의 next/font/google 처리가 받지 못해 빌드가 깨지고, 빌드 캐시(`.next/cache`, Next 16 은 Turbopack 빌드 캐시가 기본으로 켜져 있다)가 있으면 옛 CSS 를 다시 썼다
- 운영은 직전 성공 배포가 계속 나갔다. 사용자에게 깨진 화면은 없었지만 PR #48 의 변경이 운영에 반영되지 않았다

원인이 Google 응답 쪽이라 우리가 고칠 수 없고, 언제 다시 생길지도 알 수 없다.

## 결정
- Manrope 를 `next/font/local` 로 바꾸고 글꼴 파일을 레포(`src/assets/fonts/manrope/`)에 둔다
  - 원본: 공식 저장소 [googlefonts/manrope](https://github.com/googlefonts/manrope) 의 가변 woff2(4.505, wght 200~800, 53.9KB). 커밋을 고정해 받았다
  - 라틴 서브셋 1개(23,856 bytes)로 줄였다. 범위는 Google Fonts `latin` 과 같고 `₩`(U+20A9)만 더했다. 윤곽선과 굵기 축은 그대로다. 만드는 명령과 해시는 같은 폴더 `README.md`
  - Manrope 의 OFL 에는 예약 글꼴 이름이 없어서 서브셋도 이름을 그대로 쓴다 (`OFL.txt` 를 함께 둔다, CREDITS.md 에 출처)
- 바깥에서 보이는 것은 그대로 둔다: CSS 변수 `--font-manrope`, `font-display: swap`, preload(응답 `Link` 헤더)
- Pretendard 는 이미 npm 패키지 안 파일이라 그대로다 (ADR 0017)

## 대안
- `next/font/google` 유지 + 실패하면 캐시 없이 다시 배포: 원인이 우리 밖에 있어 다시 생기고, 생기면 그 사이 배포가 막힌다
- 공식 가변 woff2 를 줄이지 않고 그대로(53.9KB): 수정이 없는 것은 좋지만 첫 방문에 2배 넘게 받는다. 사이트에 쓰는 라틴 밖 글자는 `₩` 하나뿐이다
- 굵기별 정적 파일 4개(400/500/600/700): 공식 webfonts 의 정적 woff2 는 하나에 약 47KB(전체 글자)다. 가변 하나가 더 작고 요청도 하나다
- 굵기 축을 400~700 으로 자르기: 1KB 줄지만 축을 바꾸면 윤곽선 계산이 달라질 수 있어 하지 않았다
- Google 이 주는 파일(4.504)을 그대로 복사: 출처가 배포본이 아니라 응답이다. 공식 저장소 파일을 쓰고 만드는 법을 남기는 쪽을 택했다
- `@fontsource-variable/manrope` 패키지: 파일은 Google 응답과 같지만 글꼴 하나 때문에 의존성이 늘고, 파일 출처가 다시 Google 응답이 된다

## 결과
- 빌드가 바깥 네트워크 없이 된다. 네트워크를 막고 `DATA_STORE=memory pnpm build` 가 성공한다 (바꾸기 전 main 은 같은 조건에서 `Failed to fetch Manrope from Google Fonts` 로 실패)
- 글꼴 파일은 24,576 → 23,856 bytes. 대신 Google 이 latin-ext/그리스/키릴/베트남 파일로 주던 글자는 이제 Pretendard 또는 OS 글꼴로 나온다 (사이트에 쓰는 것은 `₩` 뿐이라 넣었다. 관리자가 작업 제목에 그런 글자를 쓰면 섞여 보일 수 있다)
- 공식 4.505 와 Google 응답 4.504 는 9글자(`% _ ¼ ½ ¾ ÷ − ∕`, soft hyphen)의 윤곽선이 다르고 나머지 208글자는 같다. 시각 비교는 페이지 값 15개가 그대로이고, 모바일 섹션 값 10개가 ±0.02%p 안에서 움직였다
- 대체 글꼴(Arial) 보정값은 Next 가 파일에서 다시 계산해 조금 달라졌다 (size-adjust 103.19% → 100.14%). 글꼴이 오기 전 잠깐만 쓰이고 CLS 는 0 이다
- 글꼴을 바꾸려면 Google Fonts 에서 받는 대신 README 의 명령으로 파일을 다시 만든다
- 빌드 캐시 때문에 옛 CSS 가 나가는 문제 자체는 이 결정으로 막지 않는다. 계기(글꼴 요청 실패)를 없앤 것이다. 캐시 설정은 따로 정한다
