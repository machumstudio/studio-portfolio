import { err, ok, type Result } from "@/shared/result";
import type { LocalizedText } from "./localized-text";

export type WorkImage = {
  readonly src: string;
  readonly alt: LocalizedText;
  /** 0 부터 빈칸 없이 이어지는 보여 줄 순서 */
  readonly order: number;
};

export type ImageError =
  | { type: "DuplicateImageOrder"; order: number }
  | { type: "MissingImageOrder"; order: number }
  | { type: "CoverNotInImages"; src: string };

// 이미지 순서 규칙: 순서는 0..n-1 이 한 번씩 (중복, 빈칸 불가), 대표 이미지는 목록 안의 사진.
// 관리자에서 드래그로 순서를 바꿔도 같은 규칙으로 검사한다
export function arrangeImages(
  images: readonly WorkImage[],
  coverSrc: string,
): Result<{ images: readonly WorkImage[]; cover: WorkImage }, ImageError> {
  const seen = new Set<number>();
  for (const { order } of images) {
    if (seen.has(order)) return err({ type: "DuplicateImageOrder", order });
    seen.add(order);
  }
  // 서로 다른 n 개가 0..n-1 을 모두 채우면 음수, 소수, n 이상인 값은 남지 않는다
  for (let order = 0; order < images.length; order++) {
    if (!seen.has(order)) return err({ type: "MissingImageOrder", order });
  }
  const cover = images.find((image) => image.src === coverSrc);
  if (!cover) return err({ type: "CoverNotInImages", src: coverSrc });
  return ok({
    images: [...images].sort((a, b) => a.order - b.order),
    cover,
  });
}
