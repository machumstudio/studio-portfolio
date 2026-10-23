import { createWork, type Work, type WorkInput } from "@/domain/works/work";

// 인메모리 저장소의 시작 데이터. 작업 9개는 시안 Portfolio 페이지 갤러리(제목, 연월) 그대로,
// 마지막 하나는 목록/상세에 나오면 안 되는 비공개 작업이다.
// 사진은 16칸에서 Unsplash 로 바꿀 때까지 임시 이미지라 설명(alt)을 비워 둔다
const placeholder = "/images/placeholder.svg";
const photos = (count: number) =>
  Array.from({ length: count }, (_, order) => ({
    src: placeholder,
    alt: { ko: "", en: "" },
    order,
  }));

type Seed = Omit<WorkInput, "coverSrc" | "images" | "published"> & {
  published?: boolean;
};

const seeds: Seed[] = [
  {
    id: "work-01",
    slug: "faces-of-resilience",
    title: { ko: "단단한 얼굴들", en: "Faces of Resilience" },
    category: "portrait",
    date: "2022-03",
  },
  {
    id: "work-02",
    slug: "innocence-unveiled",
    title: { ko: "있는 그대로의 순수", en: "Innocence Unveiled" },
    category: "portrait",
    date: "2020-01",
  },
  {
    id: "work-03",
    slug: "elegance-in-monochrome",
    title: { ko: "흑백의 우아함", en: "Elegance in Monochrome" },
    category: "portrait",
    date: "2020-01",
  },
  {
    id: "work-04",
    slug: "a-wedding-tale",
    title: { ko: "어느 결혼식 이야기", en: "A Wedding Tale" },
    category: "events",
    date: "2021-09",
  },
  {
    id: "work-05",
    slug: "corporate-excellence-summit",
    title: { ko: "기업 리더십 서밋", en: "Corporate Excellence Summit" },
    category: "events",
    date: "2019-11",
  },
  {
    id: "work-06",
    slug: "festival-of-colors",
    title: { ko: "색의 축제", en: "Festival of Colors" },
    category: "events",
    date: "2018-03",
  },
  {
    id: "work-07",
    slug: "product-elegance",
    title: { ko: "제품의 품격", en: "Product Elegance" },
    category: "commercial",
    date: "2020-08",
  },
  {
    id: "work-08",
    slug: "brand-storytelling",
    title: { ko: "브랜드 스토리텔링", en: "Brand Storytelling" },
    category: "commercial",
    date: "2019-05",
  },
  {
    id: "work-09",
    slug: "culinary-delights",
    title: { ko: "맛있는 순간들", en: "Culinary Delights" },
    category: "commercial",
    date: "2017-02",
  },
  {
    // 가장 최근 날짜라, 공개 필터가 빠지면 목록 맨 앞에 나와 바로 드러난다
    id: "work-10",
    slug: "behind-the-scenes",
    title: { ko: "촬영 현장 기록", en: "Behind the Scenes" },
    category: "portrait",
    date: "2024-05",
    published: false,
  },
];

// 시드는 코드에 박힌 값이라, 규칙을 어기면 조용히 빼지 않고 시작할 때 실패시킨다
export const seedWorks: readonly Work[] = seeds.map(
  ({ published = true, ...seed }) => {
    const result = createWork({
      ...seed,
      coverSrc: placeholder,
      images: photos(3),
      published,
    });
    if (!result.ok)
      throw new Error(
        `시드 작업 ${seed.slug}: ${JSON.stringify(result.error)}`,
      );
    return result.value;
  },
);
