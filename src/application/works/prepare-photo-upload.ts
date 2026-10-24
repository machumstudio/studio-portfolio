import { err, ok, type Result } from "@/shared/result";
import type { IdGenerator } from "./clock";
import { isPhotoType, photoLimits } from "./photo-limits";
import { isStorableWorkId, photoPath } from "./photo-paths";
import type { PhotoStorage, UploadTicket } from "./photo-storage";

export type PreparePhotoUploadInput = {
  workId: string;
  /** 브라우저가 줄이고 다시 인코딩한 파일의 형식과 크기 */
  type: string;
  size: number;
};

export type PreparePhotoUploadError =
  | { type: "InvalidWorkId" }
  | { type: "UnsupportedPhotoType"; value: string }
  | { type: "PhotoTooLarge"; max: number }
  | { type: "StorageFailed"; cause: unknown };

type Deps = { storage: PhotoStorage; ids: IdGenerator };

// 사진 한 장 업로드 준비: 형식과 크기를 보고, 작업 폴더 안에 새 경로를 정해 올릴 곳을 받는다.
// 새 작업은 아직 저장 전이라 작업이 있는지는 보지 않는다 (저장하지 않으면 cleanUpPhotos 가 하루 뒤 지운다).
// 파일 이름은 서버가 정한다: 원본 이름(개인정보가 들어갈 수 있다)을 쓰지 않고, 같은 경로에 덮어쓰지 않는다
export const preparePhotoUpload =
  ({ storage, ids }: Deps) =>
  async ({
    workId,
    type,
    size,
  }: PreparePhotoUploadInput): Promise<
    Result<UploadTicket, PreparePhotoUploadError>
  > => {
    if (!isStorableWorkId(workId)) return err({ type: "InvalidWorkId" });
    if (!isPhotoType(type))
      return err({ type: "UnsupportedPhotoType", value: type });
    if (!(size > 0 && size <= photoLimits.uploadBytes))
      return err({ type: "PhotoTooLarge", max: photoLimits.uploadBytes });
    try {
      return ok(
        await storage.createUpload(photoPath(workId, ids.next(), type), type),
      );
    } catch (cause) {
      return err({ type: "StorageFailed", cause });
    }
  };
