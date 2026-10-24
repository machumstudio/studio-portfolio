import type { Work, WorkId } from "@/domain/works/work";
import { err, ok, type Result } from "@/shared/result";
import type { AdminWorkRepository } from "./admin-work-repository";
import { cleanUpPhotos } from "./clean-up-photos";
import type { Clock } from "./clock";
import { isStorableWorkId } from "./photo-paths";
import type { PhotoStorage } from "./photo-storage";
import type { SaveWorkWarning } from "./save-work";

export type DeleteWorkError =
  { type: "NotFound"; id: string } | { type: "StorageFailed"; cause: unknown };

export type DeleteWorkResult = {
  /** 지운 작업 */
  work: Work;
  removedPhotos: readonly string[];
  warnings: readonly SaveWorkWarning[];
};

type Deps = {
  repo: AdminWorkRepository;
  storage: PhotoStorage;
  clock: Clock;
};

// 작업 지우기: 작업(사진 행 포함)을 먼저 지우고 그 작업 폴더의 파일을 지운다.
// 순서가 반대면 파일만 지워지고 작업이 남아 화면이 깨질 수 있다. 파일 정리가 실패하면 경고 (다음 정리가 지운다)
export const deleteWork =
  ({ repo, storage, clock }: Deps) =>
  async (id: string): Promise<Result<DeleteWorkResult, DeleteWorkError>> => {
    if (!isStorableWorkId(id)) return err({ type: "NotFound", id });
    let work: Work | null;
    try {
      work = await repo.findById(id as WorkId);
      if (!work) return err({ type: "NotFound", id });
      await repo.remove(work.id);
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
