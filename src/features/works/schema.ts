import { z } from "zod";
import type { SaveWorkInput } from "@/application/works/save-work";
import { err, ok, type Result } from "@/shared/result";

// 관리자 편집 화면이 서버 액션에 보내는 값. 브라우저가 보낸 값이라 형태(문자열, 불리언, 배열)와
// 요청 크기만 본다. 빈 값, slug 형식, 사진 규칙은 domain/application 이 칸별 오류로 돌려준다 (docs/adr/0009).
// 길이 상한은 칸 규칙이 아니라 비정상적으로 큰 요청을 막는 값이라 넉넉하게 둔다
const text = (max: number) => z.string().max(max);

export const workFormSchema = z.object({
  id: text(100),
  isNew: z.boolean(),
  titleKo: text(1000),
  titleEn: text(1000),
  slug: text(1000),
  category: text(100),
  date: text(100),
  published: z.boolean(),
  photos: z
    .array(z.object({ src: text(1000), altKo: text(1000), altEn: text(1000) }))
    .max(200),
  coverSrc: text(1000),
});

export type WorkFormValues = z.infer<typeof workFormSchema>;

export type MalformedWorkForm = { type: "MalformedForm" };

export function parseWorkForm(
  raw: unknown,
): Result<WorkFormValues, MalformedWorkForm> {
  const parsed = workFormSchema.safeParse(raw);
  return parsed.success ? ok(parsed.data) : err({ type: "MalformedForm" });
}

export const toSaveWorkInput = (values: WorkFormValues): SaveWorkInput => ({
  id: values.id,
  isNew: values.isNew,
  slug: values.slug,
  title: { ko: values.titleKo, en: values.titleEn },
  category: values.category,
  date: values.date,
  published: values.published,
  photos: values.photos.map(({ src, altKo, altEn }) => ({
    src,
    alt: { ko: altKo, en: altEn },
  })),
  coverSrc: values.coverSrc,
});

/** 사진 한 장 업로드 준비 요청 (브라우저가 줄인 뒤의 형식과 크기) */
export const uploadRequestSchema = z.object({
  workId: text(100),
  type: text(100),
  size: z.number(),
});
