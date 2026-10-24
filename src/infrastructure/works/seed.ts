import { createWork, type Work, type WorkInput } from "@/domain/works/work";

// 인메모리 저장소의 시작 데이터. 작업 9개는 시안 Portfolio 페이지 갤러리(제목, 연월) 그대로,
// 마지막 하나는 목록/상세에 나오면 안 되는 비공개 작업이다.
// 사진은 작업마다 3장, 첫 장이 대표 (public/images/works/<slug>-<n>.jpg, 출처는 docs/design/photos.md).
// alt 는 사진 내용을 짧게 적은 것
type Seed = Omit<
  WorkInput,
  "coverSrc" | "images" | "published" | "updatedAt"
> & {
  published?: boolean;
  /** 순서대로 [ko, en] alt */
  photos: [ko: string, en: string][];
};

const photos = (slug: string, alts: Seed["photos"]) =>
  alts.map(([ko, en], order) => ({
    src: `/images/works/${slug}-${order + 1}.jpg`,
    alt: { ko, en },
    order,
  }));

const seeds: Seed[] = [
  {
    id: "work-01",
    slug: "faces-of-resilience",
    title: { ko: "단단한 얼굴들", en: "Faces of Resilience" },
    category: "portrait",
    date: "2022-03",
    photos: [
      ["갈색 천을 머리에 두른 여성", "Woman with a brown shawl over her head"],
      ["턱을 괴고 정면을 보는 여성", "Woman resting her chin on her hands"],
      [
        "알록달록한 터번과 목도리를 두른 남성",
        "Man in a colorful turban and scarf",
      ],
    ],
  },
  {
    id: "work-02",
    slug: "innocence-unveiled",
    title: { ko: "있는 그대로의 순수", en: "Innocence Unveiled" },
    category: "portrait",
    date: "2020-01",
    photos: [
      [
        "구슬 머리 장식을 하고 흰 원피스를 입은 아이",
        "Child with beaded braids in a white dress",
      ],
      ["붉은빛과 푸른빛 조명을 받은 소년", "Boy lit in red and blue"],
      ["시장 골목을 걷는 소녀", "Girl walking down a market street"],
    ],
  },
  {
    id: "work-03",
    slug: "elegance-in-monochrome",
    title: { ko: "흑백의 우아함", en: "Elegance in Monochrome" },
    category: "portrait",
    date: "2020-01",
    photos: [
      [
        "챙 넓은 모자를 쓴 여성의 흑백 초상",
        "Black-and-white portrait of a woman in a wide-brimmed hat",
      ],
      [
        "어둠 속 인물의 흑백 초상",
        "Black-and-white portrait against a dark background",
      ],
      [
        "넥타이를 매만지는 청년의 흑백 초상",
        "Black-and-white portrait of a young man adjusting his tie",
      ],
    ],
  },
  {
    id: "work-04",
    slug: "a-wedding-tale",
    title: { ko: "어느 결혼식 이야기", en: "A Wedding Tale" },
    category: "events",
    date: "2021-09",
    photos: [
      ["창가에 선 신부의 뒷모습", "Bride standing at an open window"],
      [
        "노을 진 들판에서 베일을 날리는 신부",
        "Bride with a flowing veil in a field at sunset",
      ],
      [
        "붉은 전통 혼례복을 입은 신부",
        "Bride in a red traditional wedding dress",
      ],
    ],
  },
  {
    id: "work-05",
    slug: "corporate-excellence-summit",
    title: { ko: "기업 리더십 서밋", en: "Corporate Excellence Summit" },
    category: "events",
    date: "2019-11",
    photos: [
      ["무대에서 발표하는 연사", "Speaker presenting on stage"],
      ["청중이 가득 찬 강당", "Auditorium filled with attendees"],
      [
        "넓은 행사장의 무대와 청중",
        "Wide view of a conference stage and audience",
      ],
    ],
  },
  {
    id: "work-06",
    slug: "festival-of-colors",
    title: { ko: "색의 축제", en: "Festival of Colors" },
    category: "events",
    date: "2018-03",
    photos: [
      [
        "색 가루 속에서 웃는 여성",
        "Woman laughing in a cloud of colored powder",
      ],
      ["붉은 색 가루가 날리는 군중", "Crowd in clouds of red powder"],
      ["색 가루를 담은 두 손", "Colored powder in cupped hands"],
    ],
  },
  {
    id: "work-07",
    slug: "product-elegance",
    title: { ko: "제품의 품격", en: "Product Elegance" },
    category: "commercial",
    date: "2020-08",
    photos: [
      ["나뭇가지 위에 놓인 화장품 병", "Cosmetic bottle resting on a branch"],
      ["금빛 버클 클로즈업", "Close-up of a gold buckle"],
      ["무늬가 새겨진 금속 그릇", "Ornate metal vessels"],
    ],
  },
  {
    id: "work-08",
    slug: "brand-storytelling",
    title: { ko: "브랜드 스토리텔링", en: "Brand Storytelling" },
    category: "commercial",
    date: "2019-05",
    photos: [
      [
        "에어로프레스로 커피를 내리는 남성",
        "Man brewing coffee with an AeroPress",
      ],
      ["라테 아트 잔과 우유 피처", "Latte art cup and a milk pitcher"],
      ["라테 아트를 그리는 바리스타의 손", "Barista's hands pouring latte art"],
    ],
  },
  {
    id: "work-09",
    slug: "culinary-delights",
    title: { ko: "맛있는 순간들", en: "Culinary Delights" },
    category: "commercial",
    date: "2017-02",
    photos: [
      [
        "도마 위에서 초콜릿을 써는 요리사",
        "Chef chopping chocolate on a cutting board",
      ],
      ["접시에 담긴 디저트", "Plated dessert"],
      ["김이 오르는 프라이팬", "Steam rising from a pan on the stove"],
    ],
  },
  {
    // 가장 최근 날짜라, 공개 필터가 빠지면 목록 맨 앞에 나와 바로 드러난다
    id: "work-10",
    slug: "behind-the-scenes",
    title: { ko: "촬영 현장 기록", en: "Behind the Scenes" },
    category: "portrait",
    date: "2024-05",
    photos: [
      ["넓은 스튜디오의 촬영 현장", "Crew at work on a large studio set"],
      ["불길 영상 앞의 촬영 현장", "Filming in front of a fiery backdrop"],
      ["카메라를 든 사진가", "Photographer holding a camera"],
    ],
    published: false,
  },
];

// 시드의 수정 시각. 시드 데이터를 마지막으로 고친 날 (sitemap lastmod 가 매 배포마다 바뀌지 않게 고정한다)
const seedUpdatedAt = new Date("2026-10-24T00:00:00Z");

// 시드는 코드에 박힌 값이라, 규칙을 어기면 조용히 빼지 않고 시작할 때 실패시킨다
export const seedWorks: readonly Work[] = seeds.map(
  ({ published = true, photos: alts, ...seed }) => {
    const images = photos(seed.slug, alts);
    const result = createWork({
      ...seed,
      coverSrc: images[0]!.src,
      images,
      published,
      updatedAt: seedUpdatedAt,
    });
    if (!result.ok)
      throw new Error(
        `시드 작업 ${seed.slug}: ${JSON.stringify(result.error)}`,
      );
    return result.value;
  },
);
