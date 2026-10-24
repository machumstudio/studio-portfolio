import type { PhotoType } from "./photo-limits";

// 저장소 안 사진 경로: <작업 id>/<추측할 수 없는 id>.<확장자>.
// 작업 id 가 폴더라 작업을 지우면 폴더째 정리하고, 다른 작업 폴더의 사진은 그 작업에 쓸 수 없다.
// 경로에 들어가므로 작업 id 는 영문 소문자, 숫자, 하이픈만 (시드 work-01, 새 작업 UUID)
const workIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const isStorableWorkId = (id: string): boolean =>
  id.length <= 64 && workIdPattern.test(id);

const extensions: Record<PhotoType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const photoFolder = (workId: string) => `${workId}/`;

const photoPathPattern =
  /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|png|webp)$/;

/**
 * photoPath 가 만드는 모양(<작업 id>/<파일 id>.<확장자>)인지. 저장소 구현이 src 를 경로로 되돌릴 때 쓴다.
 * w-1/../w-2/a.jpg 처럼 다른 폴더를 가리키는 값이 이 작업의 사진으로 통하지 않게 한다
 */
export const isPhotoPath = (path: string): boolean =>
  path.length <= 160 && photoPathPattern.test(path);

export const photoPath = (workId: string, fileId: string, type: PhotoType) =>
  `${photoFolder(workId)}${fileId}.${extensions[type]}`;
