import type { Brand } from "@/shared/brand";
import { err, ok, type Result } from "@/shared/result";

// 작업 상세 주소(/work/[slug])에 쓰는 이름. 소문자, 숫자, 하이픈 한 개씩만
export type Slug = Brand<string, "Slug">;
export type SlugError = { type: "InvalidSlug"; value: string };

const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const parseSlug = (value: string): Result<Slug, SlugError> =>
  pattern.test(value) ? ok(value as Slug) : err({ type: "InvalidSlug", value });
