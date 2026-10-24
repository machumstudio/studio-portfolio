import "server-only";
import type {
  PhotoStorage,
  StoredPhoto,
} from "@/application/works/photo-storage";
import { isPhotoPath } from "@/application/works/photo-paths";
import type { SupabaseServerClient } from "../supabase/client";

/** 작업 사진 버킷 (supabase/migrations/20261025000002_work_photos_storage.sql) */
export const workPhotosBucket = "work-photos";

/** 공개 버킷의 사진 주소 앞부분. next.config 의 images.remotePatterns 도 이 경로를 연다 */
export const publicPhotoPath = `/storage/v1/object/public/${workPhotosBucket}/`;

const pageSize = 1000;

const failure = (action: string, error: { message: string }) =>
  new Error(`[supabase-storage] ${action} 실패: ${error.message}`, {
    cause: error,
  });

// Supabase Storage 공개 버킷 (docs/adr/0014). 관리자는 요청의 관리자 세션 클라이언트로 쓴다 (docs/adr/0012):
// 버킷 정책이 관리자가 아닌 세션의 올리기/목록/지우기를 막는다.
// - createUpload: 서명 업로드 주소 (2시간, 그 경로 하나, 덮어쓰기 불가). 브라우저가 서버를 거치지 않고 PUT 한다
// - 캐시: 기본 cache-control(1시간)을 그대로 둔다. 무료 플랜 CDN 은 지워도 캐시를 비우지 않아서,
//   길게 두면 지운 사진이 그만큼 더 보인다
export function createSupabasePhotoStorage(
  client: SupabaseServerClient,
  supabaseUrl: string,
): PhotoStorage {
  const bucket = () => client.storage.from(workPhotosBucket);
  const base = `${supabaseUrl.replace(/\/+$/, "")}${publicPhotoPath}`;

  // 폴더 하나(prefix)의 항목 전체. 폴더 항목은 id 가 null 이다
  const listAll = async (prefix: string) => {
    const entries = [];
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await bucket().list(prefix, {
        limit: pageSize,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw failure("사진 목록 읽기", error);
      entries.push(...data);
      if (data.length < pageSize) return entries;
    }
  };

  return {
    createUpload: async (path, type) => {
      if (!isPhotoPath(path))
        throw new Error("[supabase-storage] 사진 경로가 아니다");
      const { data, error } = await bucket().createSignedUploadUrl(path);
      if (error) throw failure("올릴 곳 만들기", error);
      return {
        url: data.signedUrl,
        headers: { "content-type": type, "x-upsert": "false" },
        src: `${base}${path}`,
      };
    },
    pathOf: (src) => {
      if (!src.startsWith(base)) return null;
      const path = src.slice(base.length);
      return isPhotoPath(path) ? path : null;
    },
    list: async () => {
      const folders = (await listAll("")).filter((entry) => entry.id === null);
      const photos: StoredPhoto[] = [];
      for (const folder of folders)
        for (const file of await listAll(folder.name))
          if (file.id !== null)
            photos.push({
              path: `${folder.name}/${file.name}`,
              // 시각이 없으면 방금 올린 것으로 본다 (정리가 다른 폴더의 파일을 서둘러 지우지 않게)
              createdAt: file.created_at
                ? new Date(file.created_at)
                : new Date(),
            });
      return photos;
    },
    remove: async (paths) => {
      for (let i = 0; i < paths.length; i += pageSize) {
        const { error } = await bucket().remove(paths.slice(i, i + pageSize));
        if (error) throw failure("사진 지우기", error);
      }
    },
  };
}
