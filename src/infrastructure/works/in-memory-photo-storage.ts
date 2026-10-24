import type { Clock } from "@/application/works/clock";
import {
  isPhotoType,
  photoLimits,
  type PhotoType,
} from "@/application/works/photo-limits";
import { isPhotoPath } from "@/application/works/photo-paths";
import type {
  PhotoStorage,
  StoredPhoto,
} from "@/application/works/photo-storage";

/** 인메모리 사진 주소 (app/media/work-photos/[...path]/route.ts 가 내준다) */
export const memoryPhotoBase = "/media/work-photos/";
/** 인메모리 업로드 주소 (app/admin/uploads/[token]/route.ts 가 받는다) */
export const memoryUploadBase = "/admin/uploads/";

/** Supabase 서명 업로드 주소와 같은 유효 시간 */
const uploadTtlMs = 2 * 60 * 60 * 1000;

export type MemoryPhoto = { body: Uint8Array<ArrayBuffer>; type: PhotoType };

export type ReceiveResult = "stored" | "not-found" | "rejected";

export type MemoryPhotoStorage = PhotoStorage & {
  /** 업로드 주소로 온 PUT 을 받는다. 없는/만료된/쓴 토큰은 not-found, 형식/크기/덮어쓰기는 rejected */
  receive(
    token: string,
    type: string,
    body: Uint8Array<ArrayBuffer>,
  ): ReceiveResult;
  /** 사진 주소의 파일. 없으면 null */
  read(path: string): MemoryPhoto | null;
};

type Pending = { path: string; type: PhotoType; expiresAt: number };

// 인메모리 사진 저장소 (단위/계약 테스트, DATA_STORE=memory 인 e2e). Supabase Storage 의 공개 버킷 + 서명 업로드를 흉내 낸다:
// - createUpload 는 한 번만 쓸 수 있는 토큰 주소를 준다. 브라우저는 이 앱의 업로드 주소로 PUT 한다
// - 버킷 설정처럼 형식(jpeg/png/webp)과 크기(10MB)를 보고, 이미 있는 경로는 덮어쓰지 않는다
// 서버가 다시 뜨면 파일은 모두 사라진다
export function createInMemoryPhotoStorage({
  clock,
}: {
  clock: Clock;
}): MemoryPhotoStorage {
  const files = new Map<string, MemoryPhoto & { createdAt: Date }>();
  const pending = new Map<string, Pending>();

  return {
    createUpload: async (path, type) => {
      if (!isPhotoPath(path)) throw new Error("[memory] 사진 경로가 아니다");
      if (files.has(path)) throw new Error("[memory] 이미 있는 사진 경로다");
      const token = crypto.randomUUID();
      pending.set(token, {
        path,
        type,
        expiresAt: clock.now().getTime() + uploadTtlMs,
      });
      return {
        url: `${memoryUploadBase}${token}`,
        headers: { "content-type": type },
        src: `${memoryPhotoBase}${path}`,
      };
    },
    pathOf: (src) => {
      if (!src.startsWith(memoryPhotoBase)) return null;
      const path = src.slice(memoryPhotoBase.length);
      return isPhotoPath(path) ? path : null;
    },
    list: async (): Promise<StoredPhoto[]> =>
      [...files].map(([path, { createdAt }]) => ({ path, createdAt })),
    remove: async (paths) => {
      for (const path of paths) files.delete(path);
    },
    receive: (token, type, body) => {
      const ticket = pending.get(token);
      if (!ticket || ticket.expiresAt < clock.now().getTime())
        return "not-found";
      pending.delete(token);
      if (
        !isPhotoType(type) ||
        type !== ticket.type ||
        body.byteLength === 0 ||
        body.byteLength > photoLimits.uploadBytes ||
        files.has(ticket.path)
      )
        return "rejected";
      files.set(ticket.path, { body, type, createdAt: clock.now() });
      return "stored";
    },
    read: (path) => {
      const file = files.get(path);
      return file ? { body: file.body, type: file.type } : null;
    },
  };
}
