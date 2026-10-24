# 사진 목록 (Unsplash)

2026-10-24 선정, 16칸에서 public/images/ 에 받아 커밋. 이 문서가 사진 출처의 원본이고 CREDITS.md 는 요약이다.

- 전부 Unsplash License(무료) 확인. Unsplash+ 없음. 출처 표기 의무는 없지만 CREDITS 와 이 문서에 사진가를 남긴다.
- 유명 브랜드 로고가 크게 보이는 사진은 제외했다 (우리 광고 작업처럼 보이면 안 됨).
- 라이선스: [Unsplash License](https://unsplash.com/license) (상업적 이용과 수정 가능, 출처 표기 의무 없음, 사진을 그대로 모아 경쟁 서비스를 만드는 것은 금지).
- "사진 ID" 링크가 Unsplash 페이지, "원본"은 받은 이미지 주소.

## 파일 기준
- 받기: `원본?w=2400&h=2400&fit=max&q=75&fm=jpg` (긴 변 2400 이하, JPEG 품질 75).
- 장당 700KB 이하. 넘으면 품질 60, 그래도 넘으면 긴 변 2000 으로 다시 받는다 (아래 표의 "파일" 열에 크기).
  화면에는 next/image 가 폭에 맞춰 줄이고 WebP/AVIF 로 바꿔 보내므로 원본은 확대(Lightbox 1920 폭)에 쓸 만큼만 둔다.
- 경로: 작업 `public/images/works/<slug>-<순서>.jpg`, 페이지 `public/images/pages/<자리>.jpg`, 서비스 `public/images/services/<분야>-<순서>.jpg`.
- `src/infrastructure/works/seed.test.ts` 가 작업 사진 파일이 있고 700KB 이하인지 확인한다.

## 작업 사진 (시드, 작업마다 3장, 첫 장 = 대표)

| 작업 / 순서 | 사진 ID | 사진가 | 원본 | 파일 |
|---|---|---|---|---|
| faces-of-resilience #1 (대표) | [f49XhYbpiA0](https://unsplash.com/photos/f49XhYbpiA0) | Danie Franco ([@dani_franco](https://unsplash.com/@dani_franco)) | https://images.unsplash.com/photo-1536766768598-e09213fdcf22 | `works/faces-of-resilience-1.jpg` 1602x2400, 539KB |
| faces-of-resilience #2 | [mtHQ342ezmY](https://unsplash.com/photos/mtHQ342ezmY) | Sinitta Leunen ([@sinileunen](https://unsplash.com/@sinileunen)) | https://images.unsplash.com/photo-1619694770795-e21c58464159 | `works/faces-of-resilience-2.jpg` 1600x2400, 460KB |
| faces-of-resilience #3 | [q36Hm_Z_HOU](https://unsplash.com/photos/q36Hm_Z_HOU) | Rainier Ridao ([@rainierridao](https://unsplash.com/@rainierridao)) | https://images.unsplash.com/photo-1550679952-7f3d3a38d22f | `works/faces-of-resilience-3.jpg` 1600x2400, 517KB |
| innocence-unveiled #1 (대표) | [rcVVrnIqYDg](https://unsplash.com/photos/rcVVrnIqYDg) | Gylain Omer ([@gullin_omer](https://unsplash.com/@gullin_omer)) | https://images.unsplash.com/photo-1785547217618-b3c40af30f4b | `works/innocence-unveiled-1.jpg` 1600x2400, 299KB |
| innocence-unveiled #2 | [nx7pwHKu1EY](https://unsplash.com/photos/nx7pwHKu1EY) | Pranav Kumar Jain ([@peejayvisual](https://unsplash.com/@peejayvisual)) | https://images.unsplash.com/photo-1586080017881-53dd7220a99b | `works/innocence-unveiled-2.jpg` 1600x2400, 394KB |
| innocence-unveiled #3 | [KjA49TAVjQE](https://unsplash.com/photos/KjA49TAVjQE) | Anurag Jamwal ([@aj4xo](https://unsplash.com/@aj4xo)) | https://images.unsplash.com/photo-1780504862845-e0487380a361 | `works/innocence-unveiled-3.jpg` 1600x2400, 422KB |
| elegance-in-monochrome #1 (대표) | [8BxRYuPkzkU](https://unsplash.com/photos/8BxRYuPkzkU) | Luke Braswell ([@lukebraswell](https://unsplash.com/@lukebraswell)) | https://images.unsplash.com/photo-1495462911434-be47104d70fa | `works/elegance-in-monochrome-1.jpg` 1800x2400, 146KB |
| elegance-in-monochrome #2 | [_Nd19leRtQc](https://unsplash.com/photos/_Nd19leRtQc) | Juan Manuel Merino ([@juanmaforpresident](https://unsplash.com/@juanmaforpresident)) | https://images.unsplash.com/photo-1548207775-a7676e36f20a | `works/elegance-in-monochrome-2.jpg` 1600x2400, 277KB |
| elegance-in-monochrome #3 | [esAK1uekKZY](https://unsplash.com/photos/esAK1uekKZY) | Dominick Valencia ([@pointofviewphotography](https://unsplash.com/@pointofviewphotography)) | https://images.unsplash.com/photo-1610419923009-f0a50c304f10 | `works/elegance-in-monochrome-3.jpg` 1714x2400, 295KB |
| a-wedding-tale #1 (대표) | [zGtGfqQqe6U](https://unsplash.com/photos/zGtGfqQqe6U) | Asdrubal luna ([@infectedluna](https://unsplash.com/@infectedluna)) | https://images.unsplash.com/photo-1622277430358-f4d134452e2e | `works/a-wedding-tale-1.jpg` 1434x2400, 418KB |
| a-wedding-tale #2 | [KRM-2sIbgMI](https://unsplash.com/photos/KRM-2sIbgMI) | Anna Vi ([@anna_vi_travel](https://unsplash.com/@anna_vi_travel)) | https://images.unsplash.com/photo-1502955422409-06e43fd3eff3 | `works/a-wedding-tale-2.jpg` 1600x2400, 416KB |
| a-wedding-tale #3 | [Uv0BoKKdxos](https://unsplash.com/photos/Uv0BoKKdxos) | Bulbul Ahmed ([@bulbul252](https://unsplash.com/@bulbul252)) | https://images.unsplash.com/photo-1610047614301-13c63f00c032 | `works/a-wedding-tale-3.jpg` 1333x2000, 663KB |
| corporate-excellence-summit #1 (대표) | [9zutjaUEN3Q](https://unsplash.com/photos/9zutjaUEN3Q) | Jametlene Reskp ([@reskp](https://unsplash.com/@reskp)) | https://images.unsplash.com/photo-1679579664878-2c025e3f87b0 | `works/corporate-excellence-summit-1.jpg` 2400x1347, 260KB |
| corporate-excellence-summit #2 | [QbCGUxaa4So](https://unsplash.com/photos/QbCGUxaa4So) | Compagnons ([@sigmund](https://unsplash.com/@sigmund)) | https://images.unsplash.com/photo-1574802406791-ef6898f311d3 | `works/corporate-excellence-summit-2.jpg` 1577x2400, 343KB |
| corporate-excellence-summit #3 | [6vAjp0pscX0](https://unsplash.com/photos/6vAjp0pscX0) | Alexandre Pellaes ([@apellaes](https://unsplash.com/@apellaes)) | https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04 | `works/corporate-excellence-summit-3.jpg` 2400x1600, 664KB |
| festival-of-colors #1 (대표) | [hGrvKzUfpzM](https://unsplash.com/photos/hGrvKzUfpzM) | Bulbul Ahmed ([@bulbul252](https://unsplash.com/@bulbul252)) | https://images.unsplash.com/photo-1610313898425-a5c637a940db | `works/festival-of-colors-1.jpg` 1627x2400, 507KB |
| festival-of-colors #2 | [nhkN69ICnEg](https://unsplash.com/photos/nhkN69ICnEg) | bhupesh pal ([@bhupesh_pal](https://unsplash.com/@bhupesh_pal)) | https://images.unsplash.com/photo-1617184003170-1f266c325ff3 | `works/festival-of-colors-2.jpg` 1600x2400, 682KB |
| festival-of-colors #3 | [tRwrK5eA0ng](https://unsplash.com/photos/tRwrK5eA0ng) | Souvik laha ([@chandra123456789](https://unsplash.com/@chandra123456789)) | https://images.unsplash.com/photo-1617173315663-a6f63e72634e | `works/festival-of-colors-3.jpg` 1404x2000, 657KB |
| product-elegance #1 (대표) | [tAEUyxydEwQ](https://unsplash.com/photos/tAEUyxydEwQ) | Marios Gkortsilas ([@mr_mgk](https://unsplash.com/@mr_mgk)) | https://images.unsplash.com/photo-1768161680637-630f069f243a | `works/product-elegance-1.jpg` 1920x2400, 451KB |
| product-elegance #2 | [CkeOwnoLK5U](https://unsplash.com/photos/CkeOwnoLK5U) | Ruan Richard Rodrigues ([@ricdeoliveira](https://unsplash.com/@ricdeoliveira)) | https://images.unsplash.com/photo-1758297679787-12524226e30f | `works/product-elegance-2.jpg` 1600x2400, 598KB |
| product-elegance #3 | [av-IqDIxN78](https://unsplash.com/photos/av-IqDIxN78) | Gaurav Kumar ([@countingframez](https://unsplash.com/@countingframez)) | https://images.unsplash.com/photo-1669823734572-57c47df22b52 | `works/product-elegance-3.jpg` 1600x2400, 650KB |
| brand-storytelling #1 (대표) | [WQWQFcG5Zj4](https://unsplash.com/photos/WQWQFcG5Zj4) | Heidi Meer ([@heidi_meerdavon](https://unsplash.com/@heidi_meerdavon)) | https://images.unsplash.com/photo-1719488757644-309df536c17b | `works/brand-storytelling-1.jpg` 1800x2400, 354KB |
| brand-storytelling #2 | [rCzsIG76fz0](https://unsplash.com/photos/rCzsIG76fz0) | Raymond Petrik ([@raymondpetrik](https://unsplash.com/@raymondpetrik)) | https://images.unsplash.com/photo-1775818184927-38487fd32ee2 | `works/brand-storytelling-2.jpg` 1600x2400, 361KB |
| brand-storytelling #3 | [H2cQehRgzJQ](https://unsplash.com/photos/H2cQehRgzJQ) | Raymond Petrik ([@raymondpetrik](https://unsplash.com/@raymondpetrik)) | https://images.unsplash.com/photo-1775818184768-7df7dbfae170 | `works/brand-storytelling-3.jpg` 1600x2400, 374KB |
| culinary-delights #1 (대표) | [rOkbYkD-tOo](https://unsplash.com/photos/rOkbYkD-tOo) | Cemrecan Yurtman ([@cmrcn_](https://unsplash.com/@cmrcn_)) | https://images.unsplash.com/photo-1736788265300-e1b8daab0ae7 | `works/culinary-delights-1.jpg` 2400x1600, 529KB |
| culinary-delights #2 | [e1yQbGc0RnQ](https://unsplash.com/photos/e1yQbGc0RnQ) | Sophie Lee-Tin-Yien ([@sophielty](https://unsplash.com/@sophielty)) | https://images.unsplash.com/photo-1780181612148-20a394ff0dff | `works/culinary-delights-2.jpg` 1600x2400, 423KB |
| culinary-delights #3 | [KlR6vX1R0fQ](https://unsplash.com/photos/KlR6vX1R0fQ) | Duane Mendes ([@duanemendes](https://unsplash.com/@duanemendes)) | https://images.unsplash.com/photo-1621494547944-5ddbc84514b2 | `works/culinary-delights-3.jpg` 1600x2400, 554KB |
| behind-the-scenes (비공개) #1 (대표) | [ntqaFfrDdEA](https://unsplash.com/photos/ntqaFfrDdEA) | Jakob Owens ([@jakobowens1](https://unsplash.com/@jakobowens1)) | https://images.unsplash.com/photo-1632187989763-c9c620420b4d | `works/behind-the-scenes-1.jpg` 2400x1600, 672KB |
| behind-the-scenes (비공개) #2 | [4SYDbxHG0t8](https://unsplash.com/photos/4SYDbxHG0t8) | Gordon Cowie ([@gcowie](https://unsplash.com/@gcowie)) | https://images.unsplash.com/photo-1600660792241-240f01455c6f | `works/behind-the-scenes-2.jpg` 2400x1600, 482KB |
| behind-the-scenes (비공개) #3 | [6zEfniBMs6c](https://unsplash.com/photos/6zEfniBMs6c) | Szabo Viktor ([@vmxhu](https://unsplash.com/@vmxhu)) | https://images.unsplash.com/photo-1542992933-ce75d0187ec1 | `works/behind-the-scenes-3.jpg` 2400x1600, 179KB |

## 페이지 사진

| 자리 | 사진 ID | 사진가 | 원본 | 파일 |
|---|---|---|---|---|
| 홈 About 요약 사진 | [GqHeaHja5m0](https://unsplash.com/photos/GqHeaHja5m0) | Prince Akachi ([@princearkman](https://unsplash.com/@princearkman)) | https://images.unsplash.com/photo-1531384698654-7f6e477ca221 | `pages/home-about.jpg` 1655x2400, 421KB |
| About 히어로 | [fB3-uW_TUcs](https://unsplash.com/photos/fB3-uW_TUcs) | Matt Roskovec ([@cutandcotton](https://unsplash.com/@cutandcotton)) | https://images.unsplash.com/photo-1580892047528-7dfd384dce65 | `pages/about-hero.jpg` 2400x1350, 348KB |
| Portfolio 히어로 | [P9BHbcYCqx4](https://unsplash.com/photos/P9BHbcYCqx4) | Tony Pham ([@tonyphamvn](https://unsplash.com/@tonyphamvn)) | https://images.unsplash.com/photo-1596095713029-5f68b397f1c3 | `pages/portfolio-hero.jpg` 2400x1347, 515KB |
| Services 히어로 | [Qy-LgJuED0o](https://unsplash.com/photos/Qy-LgJuED0o) | Lana Mattice ([@lanamattice](https://unsplash.com/@lanamattice)) | https://images.unsplash.com/photo-1641236210747-48bc43e4517f | `pages/services-hero.jpg` 2400x1600, 472KB |
| Contact 히어로 | [dyk_f6Byhrg](https://unsplash.com/photos/dyk_f6Byhrg) | Matt Bero ([@mbeero](https://unsplash.com/@mbeero)) | https://images.unsplash.com/photo-1674615420480-1a8b651aeb05 | `pages/contact-hero.jpg` 2400x1600, 354KB |

## 서비스 슬라이더 (가로 사진, 분야마다 3장)

| 분야 / 순서 | 사진 ID | 사진가 | 원본 | 파일 |
|---|---|---|---|---|
| 인물 #1 | [2YyQUXkcjHg](https://unsplash.com/photos/2YyQUXkcjHg) | Callie Morgan ([@calliestorystreet](https://unsplash.com/@calliestorystreet)) | https://images.unsplash.com/photo-1474399272551-ae48932dbe00 | `services/portrait-1.jpg` 2400x1602, 201KB |
| 인물 #2 | [CHyPGOgGFmI](https://unsplash.com/photos/CHyPGOgGFmI) | Parastoo Maleki ([@blueswallow](https://unsplash.com/@blueswallow)) | https://images.unsplash.com/photo-1591702694335-1081adc8a98a | `services/portrait-2.jpg` 2400x1600, 356KB |
| 인물 #3 | [Ef3AOkt6hHg](https://unsplash.com/photos/Ef3AOkt6hHg) | Kirill Balobanov ([@kbalobanov](https://unsplash.com/@kbalobanov)) | https://images.unsplash.com/photo-1532170579297-281918c8ae72 | `services/portrait-3.jpg` 2400x1576, 296KB |
| 이벤트 #1 | [4BQPUDJxMe8](https://unsplash.com/photos/4BQPUDJxMe8) | Jakob Owens ([@jakobowens1](https://unsplash.com/@jakobowens1)) | https://images.unsplash.com/photo-1606217239582-d9f72323bcd7 | `services/events-1.jpg` 2400x1600, 543KB |
| 이벤트 #2 | [CKMm3n_j_S0](https://unsplash.com/photos/CKMm3n_j_S0) | Ashwini Chaudhary(Monty) ([@suicide_chewbacca](https://unsplash.com/@suicide_chewbacca)) | https://images.unsplash.com/photo-1574017213370-4e7d893040f9 | `services/events-2.jpg` 2400x1600, 480KB |
| 이벤트 #3 | [LdpSdMmy29E](https://unsplash.com/photos/LdpSdMmy29E) | Pedro Pulido ([@pedropulidophotography](https://unsplash.com/@pedropulidophotography)) | https://images.unsplash.com/photo-1758810411287-a362740f269e | `services/events-3.jpg` 2400x1600, 500KB |
| 광고 #1 | [McrcNjB3WdA](https://unsplash.com/photos/McrcNjB3WdA) | Harshit Suryawanshi ([@harshit_suryawanshi](https://unsplash.com/@harshit_suryawanshi)) | https://images.unsplash.com/photo-1697301439997-052adc7d7443 | `services/commercial-1.jpg` 2400x1600, 401KB |
| 광고 #2 | [0M9wB84qeFw](https://unsplash.com/photos/0M9wB84qeFw) | Harshit Suryawanshi ([@harshit_suryawanshi](https://unsplash.com/@harshit_suryawanshi)) | https://images.unsplash.com/photo-1697301440098-a95844278c2b | `services/commercial-2.jpg` 2400x1800, 387KB |
| 광고 #3 | [qu2JENeCaE4](https://unsplash.com/photos/qu2JENeCaE4) | Olga Serjantu ([@olgaserjantu](https://unsplash.com/@olgaserjantu)) | https://images.unsplash.com/photo-1611149974482-764b0c2a211a | `services/commercial-3.jpg` 2400x1600, 455KB |

## 재사용 (새 파일 없음)

코드: `src/app/[locale]/(site)/_sections/photos.ts`. 페이지 사진 alt 는 `Photos.*` 메시지, 작업 사진 alt 는 시드.

- 홈 히어로 콜라주 7칸 (DOM 순서): faces-of-resilience #2, innocence-unveiled #2, a-wedding-tale #2, festival-of-colors #2, brand-storytelling #2, elegance-in-monochrome #2, culinary-delights #2
- 홈 서비스 슬라이더 3개: 서비스 슬라이더 인물 #1, 이벤트 #1, 광고 #1
- 홈 포트폴리오 미리보기 / Portfolio 카드: 작업 대표 사진 (데이터에서)
