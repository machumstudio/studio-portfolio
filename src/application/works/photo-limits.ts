// 작업 사진 한도와 형식. 관리자 화면(업로드 전 안내), 유스케이스(업로드 준비, 저장), Storage 버킷 설정
// (supabase/migrations/*_work_photos_storage.sql 의 file_size_limit, allowed_mime_types)이 같은 값을 쓴다.
// Supabase 무료 플랜: Storage 1GB, 파일 하나 50MB 까지
export const photoLimits = {
  /** 고를 수 있는 원본 한 장 (브라우저에서 줄이기 전). 무료 플랜의 업로드 한도와 같다 */
  originalBytes: 50 * 1024 * 1024,
  /** 브라우저가 줄이고 다시 인코딩한 뒤 올리는 파일 한 장. 긴 변 2400 JPEG 는 보통 1~3MB 다 */
  uploadBytes: 10 * 1024 * 1024,
  /** 줄인 사진의 긴 변 (px). 3xl(1920) 화면의 2배 밀도 사진 칸보다 크다 */
  longEdge: 2400,
  /** 작업 하나의 사진 수. 1GB 를 장당 2MB 로 잡으면 작업 15개쯤이 한 번에 꽉 차지 않는 값 */
  perWork: 30,
} as const;

export const photoTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export type PhotoType = (typeof photoTypes)[number];

export const isPhotoType = (value: string): value is PhotoType =>
  (photoTypes as readonly string[]).includes(value);
