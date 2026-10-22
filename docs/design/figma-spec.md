# Figma 시안 요약

원본: Photographer Portfolio Website UI Template - Dark Theme | Produce UI (https://www.figma.com/community/file/1324089527430438614, CC BY 4.0)

## 프레임
5페이지 x 3사이즈 = 15프레임. 태블릿 시안 없음.
| 페이지 | Desktop 1920 | Laptop 1440 | Mobile 390 |
|---|---|---|---|
| Home | 1920x7291 | 1440x5884 | 390x6616 |
| About | 1920x4784 | 1440x3918 | 390x4471 |
| Portfolio | 1920x7044 | 1440x5627 | 390x5299 |
| Services | 1920x8497 | 1440x6863 | 390x7994 |
| Contact | 1920x4059 | 1440x3241 | 390x3553 |

## 그리드
- Desktop: 12 col, gutter 20, 좌우 162 → 콘텐츠 1596
- Laptop: 12 col, gutter 20, 좌우 80 → 콘텐츠 1280
- Mobile: 6 col, gutter 20, 좌우 16 → 콘텐츠 358
- 섹션 사이 간격: Desktop 80~150 / Laptop 60~ / Mobile 40 (정확한 값은 노드 JSON의 y 차이와 gap)

## 폰트와 글자
Manrope (Regular/Medium/SemiBold/Bold). 시안 실측 최빈값:
| 용도 | Desktop | Laptop | Mobile | 굵기 / 행간 |
|---|---|---|---|---|
| 히어로 이름 | 80 | 60 | 40 | 600 / auto |
| 가격 | 80 | 50 | 34 | 500 / 1.5 |
| 섹션 제목 | 58 | 48 | 28 | 600 / auto |
| 카드 제목 | 44 | 34 | 24~28 | 600 / auto |
| 소제목 | 28~30 | 24 | 20 | 500 / 1.5 |
| 라벨/버튼/강조 | 20 | 18 | 16 | 500~600 |
| 본문 | 18 | 16 | 14 | 400~500 / 1.5 |

## 페이지별 섹션 (위에서부터)
| 페이지 | 섹션 |
|---|---|
| Home | Header · Hero(이름 + 사진 콜라주 8장 + 카테고리 마키 + "Let's Work Together" 버튼) · About 요약(사진 + Introduction + Contact Information + 소셜/버튼) · Services 슬라이더(카테고리 탭 + 설명 + 하이라이트 목록 + 이미지) · Portfolio 미리보기 3카드(View Project) · FAQ(2열 아코디언) · Testimonials(총 리뷰 수 + 카드 3개 + 좌우 화살표) · CTA + Footer(큰 워드마크 + 마키 + 링크 4열) |
| About | Header · 소개 + 통계(15+ 등) · 연도별 타임라인(Year - 2005 ...) · Testimonials · CTA + Footer |
| Portfolio | Header · 페이지 히어로 · 카테고리별 갤러리(Portraits, Events 등) · FAQ · Testimonials · CTA + Footer |
| Services | Header · 페이지 히어로 · 서비스별 가격 패키지($250, $400 ...) · FAQ · CTA + Footer |
| Contact | Header · 연락처 정보 + 문의 폼(이름/이메일/전화/메시지 등) · Testimonials · CTA + Footer |

## 공통 컴포넌트 (Figma 컴포넌트는 0개라 패턴 기준으로 나눔)
Header(데스크톱 nav + 모바일 햄버거) · Footer · CTA "Let's Work Together" · CategoryMarquee · SectionHeading(라벨 + 제목 + 우측 버튼) · Button(primary purple / outline dark / icon arrow) · HighlightItem(하이라이트 목록 항목) · FaqAccordion · TestimonialCard + 슬라이더 · ServiceCard · PortfolioCard · PriceCard · Stat · TimelineItem · Field(Input/Textarea/Select) · Gallery + Lightbox

## 시안에 없는 화면 (직접 설계)
- 태블릿 768: 노트북 레이아웃을 2열 위주로 축소
- 작업 상세 `/work/[slug]`: 홈/포트폴리오 카드의 "View Project" 목적지. 큰 이미지 + 갤러리 + 라이트박스 + 다음 작업
- 관리자 `/admin`: 로그인 · 작업 목록/등록/수정(이미지 드래그 업로드, 순서 변경) · 문의 목록(신규/확인/완료)
- 404

## 노드 JSON 읽는 법 (`docs/design/nodes/*.json`)
| 키 | 뜻 |
|---|---|
| n / t | 레이어 이름 / 타입 (FRAME, TEXT, INSTANCE, RECTANGLE ...) |
| w / h | 크기(px). TEXT는 h 생략 |
| layout | row / col (auto layout 방향) |
| gap / pad | itemSpacing / padding "top right bottom left" |
| align | 주축/교차축 정렬 (MIN, CENTER, MAX, SPACE_BETWEEN) |
| sz | 가로/세로 sizing 첫 글자 (F=FILL, H=HUG, X=FIXED) |
| fill | 색 스타일 이름(예: Dark/06) 또는 hex, IMAGE |
| stroke / r | 테두리 "두께 색" / radius |
| text, fs, font, lh, ls, case | 텍스트 내용, 크기, 굵기 스타일, 행간, 자간, 대소문자 변환 |
| c | 자식 목록 (보이는 것만, 깊이 9까지) |
