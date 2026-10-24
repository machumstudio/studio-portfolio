import type { PhotoType } from "./photo-limits";

/** 브라우저가 사진 한 장을 직접 올릴 곳 */
export type UploadTicket = {
  /** PUT 할 주소. 이 경로 하나에만, 정해진 시간 안에 쓸 수 있다 (덮어쓰기 불가) */
  url: string;
  /** PUT 에 같이 보낼 헤더 (content-type 등) */
  headers: Readonly<Record<string, string>>;
  /** 올린 뒤 작업 사진의 src 로 쓰는 주소 */
  src: string;
};

export type StoredPhoto = {
  /** 저장소 안의 경로: <작업 id>/<파일> (photo-paths.ts) */
  path: string;
  createdAt: Date;
};

// 작업 사진 파일 저장소 포트. 구현: infrastructure/works (인메모리, Supabase Storage).
// 두 구현은 infrastructure/works/photo-storage.contract.ts 를 같이 통과해야 한다.
// 파일은 서버를 거치지 않고 브라우저가 올린다 (서버 액션 본문 한도, docs/adr/0012). 서버는 올릴 곳만 정해 준다.
// 저장소 장애는 Promise 거부로 알린다
export type PhotoStorage = {
  /** path 에 파일 하나를 올릴 곳을 만든다. 권한(관리자 세션)이 없으면 거부 */
  createUpload(path: string, type: PhotoType): Promise<UploadTicket>;
  /**
   * 이 저장소의 사진 주소(src)면 저장소 안 경로, 아니면 null.
   * 시드 사진(/images/works/...)처럼 저장소 밖의 사진은 null 이라 정리 대상이 아니다
   */
  pathOf(src: string): string | null;
  /** 저장된 파일 전체 */
  list(): Promise<readonly StoredPhoto[]>;
  /** 없는 경로는 무시한다 */
  remove(paths: readonly string[]): Promise<void>;
};
