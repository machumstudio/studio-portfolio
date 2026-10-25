# Manrope (라틴 서브셋, 가변)
`src/lib/fonts.ts` 가 `next/font/local` 로 쓴다. 빌드가 Google Fonts 에 요청하지 않게 레포에 둔다 (docs/adr/0023).

- 원본: [googlefonts/manrope](https://github.com/googlefonts/manrope) `fonts/webfonts/Manrope[wght].woff2`, 커밋 `468c0dbe38efa331b80bfe9448256abe27be44c3`, 버전 4.505, 가변 wght 200~800
  - sha256 `30b83738add8c9edd9e3450b98036a9a8fb5668d0cbd4eb0ce5fe6761197f21f` (53,892 bytes)
- 라이선스: SIL Open Font License 1.1 (`OFL.txt`, 원본 레포 그대로). 예약 글꼴 이름이 없어서 서브셋도 이름 Manrope 를 그대로 쓴다
- 이 파일: `Manrope-Latin-Variable.woff2` (23,856 bytes), sha256 `84a90ed2c199a57ace8addae552cd26ee88c2bba711ee560b88d7feb769da9f2`
  - 글자 범위: Google Fonts 의 `latin` 서브셋과 같은 범위 + `U+20A9`(₩, 영어 서비스 화면의 가격). Google 은 ₩ 을 latin-ext 파일로 줬다
  - 오픈타입 기능: Google Fonts latin 파일에 있던 것만 (calt, dnom, frac, liga, locl, numr, pnum, tnum, kern)
  - 윤곽선은 손대지 않았다 (굵기 축도 200~800 그대로)

다시 만들기 (fonttools 4.60.2 + brotli, 같은 입력이면 같은 파일이 나온다):
```sh
pyftsubset 'Manrope[wght].woff2' \
  --unicodes='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20A9,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD' \
  --layout-features='calt,dnom,frac,liga,locl,numr,pnum,tnum,kern' \
  --flavor=woff2 --output-file=Manrope-Latin-Variable.woff2
```
