import type { AdminWorkRepository } from "./admin-work-repository";
import type { Clock } from "./clock";
import { photoFolder } from "./photo-paths";
import type { PhotoStorage } from "./photo-storage";

/** 어느 작업에도 쓰이지 않는 파일을 이 시간이 지나면 지운다 (올리고 저장하지 않고 떠난 새 작업) */
export const orphanPhotoGraceMs = 24 * 60 * 60 * 1000;

type Deps = {
  repo: AdminWorkRepository;
  storage: PhotoStorage;
  clock: Clock;
};

// 고아 파일 정리: 어느 작업 사진에도 없는 파일을 지운다. 지운 경로를 돌려준다.
// - workId 의 폴더(방금 저장하거나 지운 작업)는 바로 지운다: 편집 중 빼거나 바꾼 사진, 지운 작업의 사진
// - 다른 폴더는 하루가 지난 것만: 다른 탭에서 새 작업에 올리는 중인 사진을 지우지 않게
// 작업 저장/삭제 뒤에 부른다. 실패는 호출한 쪽이 경고로 바꾼다 (작업 저장은 이미 끝났다)
export const cleanUpPhotos =
  ({ repo, storage, clock }: Deps) =>
  async ({ workId }: { workId?: string } = {}): Promise<readonly string[]> => {
    const [works, stored] = await Promise.all([repo.findAll(), storage.list()]);
    const used = new Set(
      works.flatMap((work) =>
        work.images.flatMap(({ src }) => storage.pathOf(src) ?? []),
      ),
    );
    const cutoff = clock.now().getTime() - orphanPhotoGraceMs;
    const orphans = stored
      .filter(
        ({ path, createdAt }) =>
          !used.has(path) &&
          ((workId !== undefined && path.startsWith(photoFolder(workId))) ||
            createdAt.getTime() < cutoff),
      )
      .map(({ path }) => path);
    if (orphans.length > 0) await storage.remove(orphans);
    return orphans;
  };
