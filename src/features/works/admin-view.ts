import type { Work } from "@/domain/works/work";
import type { WorkFormValues } from "./schema";
import type { AdminWorkRow } from "./ui/AdminWorkList";

// 관리자 화면이 받는 모양으로 바꾸기 (페이지가 쓴다). 관리자 화면은 한국어라 사진 설명은 ko 를 먼저 쓴다

export const toAdminWorkRow = (work: Work): AdminWorkRow => ({
  id: work.id,
  slug: work.slug,
  titleKo: work.title.ko,
  titleEn: work.title.en,
  date: work.date,
  published: work.published,
  cover: { src: work.cover.src, alt: work.cover.alt.ko },
  photoCount: work.images.length,
});

export const toWorkFormValues = (work: Work): WorkFormValues => ({
  id: work.id,
  isNew: false,
  titleKo: work.title.ko,
  titleEn: work.title.en,
  slug: work.slug,
  category: work.category,
  date: work.date,
  published: work.published,
  photos: work.images.map(({ src, alt }) => ({
    src,
    altKo: alt.ko,
    altEn: alt.en,
  })),
  coverSrc: work.cover.src,
});

export const newWorkFormValues = (id: string): WorkFormValues => ({
  id,
  isNew: true,
  titleKo: "",
  titleEn: "",
  slug: "",
  category: "",
  date: "",
  published: false,
  photos: [],
  coverSrc: "",
});
