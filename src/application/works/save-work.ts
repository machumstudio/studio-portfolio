import type { ImageError, WorkImage } from "@/domain/works/images";
import type { LocalizedText } from "@/domain/works/localized-text";
import type { SlugError } from "@/domain/works/slug";
import {
  createWork,
  validateWorkFields,
  type Work,
  type WorkFieldErrors,
  type WorkId,
} from "@/domain/works/work";
import { err, ok, type Result } from "@/shared/result";
import type { AdminWorkRepository } from "./admin-work-repository";
import { cleanUpPhotos } from "./clean-up-photos";
import type { Clock } from "./clock";
import { photoLimits } from "./photo-limits";
import { isStorableWorkId, photoFolder } from "./photo-paths";
import type { PhotoStorage } from "./photo-storage";

export type SaveWorkInput = {
  id: string;
  /** 새 작업 만들기면 true, 있는 작업 고치기면 false */
  isNew: boolean;
  slug: string;
  title: LocalizedText;
  category: string;
  date: string;
  published: boolean;
  /** 보여 줄 순서대로. 순서 번호는 이 순서에서 정한다 */
  photos: readonly { src: string; alt: LocalizedText }[];
  /** photos 중 대표 사진의 src */
  coverSrc: string;
};

/** domain 칸 오류 + 저장소를 봐야 아는 오류 */
export type SaveWorkFieldErrors = Omit<WorkFieldErrors, "slug" | "images"> & {
  slug?: SlugError | { type: "SlugTaken" };
  images?:
    | ImageError
    | { type: "TooManyPhotos"; max: number }
    /** 이 작업의 사진도, 이 작업 폴더에 올린 사진도 아닌 src */
    | { type: "UnknownPhoto"; src: string };
};

export type SaveWorkError =
  | { type: "InvalidWork"; fields: SaveWorkFieldErrors }
  /** 고치려는 작업이 없다 (다른 탭에서 지웠다) */
  | { type: "NotFound"; id: string }
  /** 새 작업인데 같은 id 가 이미 있다 (두 번 제출) */
  | { type: "AlreadyExists"; id: string }
  | { type: "StorageFailed"; cause: unknown };

/** 작업은 저장됐지만 따로 알려야 하는 일. 화면에는 성공으로 보이고 서버 로그에 남긴다 */
export type SaveWorkWarning = { type: "PhotoCleanUpFailed"; cause: unknown };

export type SaveWorkResult = {
  work: Work;
  /** 정리하며 지운 파일 (편집 중 빼거나 바꾼 사진) */
  removedPhotos: readonly string[];
  warnings: readonly SaveWorkWarning[];
};

type Deps = {
  repo: AdminWorkRepository;
  storage: PhotoStorage;
  clock: Clock;
};

const trimText = ({ ko, en }: LocalizedText): LocalizedText => ({
  ko: ko.trim(),
  en: en.trim(),
});

// 작업 만들기/고치기: 칸 검사(domain) → 있는지 확인 → 사진 출처와 장수 → slug 중복 → 저장 → 고아 파일 정리.
// 틀린 칸은 한 번에 모두 돌려준다. 사진 파일 정리가 실패해도 저장은 되돌리지 않고 경고로 돌려준다
// (남은 파일은 다음 저장/삭제의 정리가 다시 지운다)
export const saveWork =
  ({ repo, storage, clock }: Deps) =>
  async (
    input: SaveWorkInput,
  ): Promise<Result<SaveWorkResult, SaveWorkError>> => {
    // 새 작업 id 는 서버가 정해 화면에 넘긴다. 형식이 틀리면 화면이 보낸 값이 아니다
    if (!isStorableWorkId(input.id))
      return err({ type: "NotFound", id: input.id });

    const images: WorkImage[] = input.photos.map(({ src, alt }, order) => ({
      src,
      alt: trimText(alt),
      order,
    }));
    const workInput = {
      id: input.id,
      slug: input.slug.trim(),
      title: input.title,
      category: input.category,
      date: input.date,
      coverSrc: input.coverSrc,
      images,
      published: input.published,
      updatedAt: clock.now(),
    };

    let existing: Work | null;
    let sameSlug: Work | null;
    try {
      [existing, sameSlug] = await Promise.all([
        repo.findById(input.id as WorkId),
        repo.findBySlug(workInput.slug as Work["slug"]),
      ]);
    } catch (cause) {
      return err({ type: "StorageFailed", cause });
    }
    if (input.isNew && existing)
      return err({ type: "AlreadyExists", id: input.id });
    if (!input.isNew && !existing)
      return err({ type: "NotFound", id: input.id });

    const fields: SaveWorkFieldErrors = { ...validateWorkFields(workInput) };
    if (!fields.slug && sameSlug && sameSlug.id !== input.id)
      fields.slug = { type: "SlugTaken" };
    const photoError = checkPhotos(images, existing, input.id, storage);
    if (photoError) fields.images = photoError;
    if (Object.keys(fields).length > 0)
      return err({ type: "InvalidWork", fields });

    const created = createWork(workInput);
    // 칸 검사를 통과하면 createWork 도 통과한다 (id 는 위에서 봤다). 두 규칙이 어긋나면 숨기지 않고 던진다
    if (!created.ok)
      throw new Error(`칸 검사와 createWork 가 다르다: ${created.error.type}`);
    const work = created.value;

    try {
      if ((await repo.save(work)) === "slug-taken")
        return err({
          type: "InvalidWork",
          fields: { slug: { type: "SlugTaken" } },
        });
    } catch (cause) {
      return err({ type: "StorageFailed", cause });
    }

    try {
      const removedPhotos = await cleanUpPhotos({ repo, storage, clock })({
        workId: work.id,
      });
      return ok({ work, removedPhotos, warnings: [] });
    } catch (cause) {
      return ok({
        work,
        removedPhotos: [],
        warnings: [{ type: "PhotoCleanUpFailed", cause }],
      });
    }
  };

// 쓸 수 있는 사진: 이 작업에 이미 있던 사진(시드의 /images/... 포함), 또는 이 작업 폴더에 올린 사진.
// 다른 작업의 사진이나 바깥 주소를 붙이면 그 작업을 지울 때 파일이 같이 사라지거나 화면이 깨진다
function checkPhotos(
  images: readonly WorkImage[],
  existing: Work | null,
  workId: string,
  storage: PhotoStorage,
): SaveWorkFieldErrors["images"] {
  if (images.length > photoLimits.perWork)
    return { type: "TooManyPhotos", max: photoLimits.perWork };
  const kept = new Set(existing?.images.map(({ src }) => src));
  const unknown = images.find(
    ({ src }) =>
      !kept.has(src) && !storage.pathOf(src)?.startsWith(photoFolder(workId)),
  );
  return unknown ? { type: "UnknownPhoto", src: unknown.src } : undefined;
}
