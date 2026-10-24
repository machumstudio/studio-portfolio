import {
  isPhotoType,
  photoLimits,
  type PhotoType,
} from "@/application/works/photo-limits";
import type { UploadTicket } from "@/application/works/photo-storage";
import type { UploadFailureCode } from "../form-state";

// 브라우저에서 사진 한 장을 올리는 과정: 고른 파일 검사 → 줄이고 다시 인코딩 → 올릴 곳 받기 → PUT(진행률).
// 메시지 키는 AdminWorks.photos.problems.<code>

export type PhotoProblem =
  | UploadFailureCode
  /** 브라우저가 열지 못한 파일 (깨진 파일, 확장자만 jpg 인 HEIC 등) */
  | "unreadable"
  /** 줄여도 업로드 한도를 넘는다 */
  | "tooLargeAfterResize"
  /** 네트워크가 끊기거나 저장소가 거부했다 */
  | "uploadFailed"
  /** 작업 하나의 사진 장수를 넘는다 */
  | "tooMany";

export class PhotoUploadError extends Error {
  constructor(readonly code: PhotoProblem) {
    super(`사진을 올리지 못했다: ${code}`);
  }
}

/** 고른 원본 파일 검사. 비율은 보지 않는다 (어떤 비율이 와도 화면이 맞춘다) */
export function checkPhotoFile(file: {
  type: string;
  size: number;
}): PhotoProblem | null {
  if (!isPhotoType(file.type)) return "unsupportedType";
  if (file.size > photoLimits.originalBytes) return "tooLarge";
  return null;
}

/** 긴 변이 longEdge 를 넘으면 비율을 지켜 줄인다. 키우지는 않는다 */
export function fitWithin(width: number, height: number, longEdge: number) {
  const scale = Math.min(1, longEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** RGBA 픽셀 중 하나라도 투명하면 true */
export function hasTransparency(rgba: Uint8ClampedArray): boolean {
  for (let i = 3; i < rgba.length; i += 4) if (rgba[i]! < 255) return true;
  return false;
}

export type ShrunkPhoto = { blob: Blob; type: PhotoType };

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * 긴 변 2400 이하로 줄이고 다시 인코딩한다. 캔버스로 다시 그리면 EXIF(촬영 위치, 기기 정보)가 남지 않는다.
 * 사진 방향(EXIF orientation)은 그리기 전에 적용한다. 투명한 곳이 없으면 JPEG, 있으면 PNG(크면 WebP)
 */
export async function shrinkPhoto(file: File): Promise<ShrunkPhoto> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new PhotoUploadError("unreadable");
  }
  try {
    const { width, height } = fitWithin(
      bitmap.width,
      bitmap.height,
      photoLimits.longEdge,
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new PhotoUploadError("unreadable");
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);
    const transparent =
      file.type !== "image/jpeg" &&
      hasTransparency(context.getImageData(0, 0, width, height).data);
    const attempts: [PhotoType, number?][] = transparent
      ? [["image/png"], ["image/webp", 0.9]]
      : [
          ["image/jpeg", 0.85],
          ["image/jpeg", 0.7],
        ];
    for (const [type, quality] of attempts) {
      const blob = await toBlob(canvas, type, quality);
      // 브라우저가 형식을 지원하지 않으면 PNG 로 돌려준다 (type 이 다르다)
      if (blob && blob.type === type && blob.size <= photoLimits.uploadBytes)
        return { blob, type };
    }
    throw new PhotoUploadError("tooLargeAfterResize");
  } finally {
    bitmap.close();
  }
}

/** 올릴 곳에 PUT. fetch 는 업로드 진행률을 주지 않아 XMLHttpRequest 를 쓴다 */
export function putWithProgress(
  ticket: UploadTicket,
  blob: Blob,
  onProgress: (ratio: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", ticket.url);
    for (const [name, value] of Object.entries(ticket.headers))
      request.setRequestHeader(name, value);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new PhotoUploadError("uploadFailed"));
    request.onerror = () => reject(new PhotoUploadError("uploadFailed"));
    request.send(blob);
  });
}

export type UploadProgress =
  { phase: "processing" } | { phase: "uploading"; ratio: number };

/** 편집 화면이 쓰는 업로드 함수. 스토리와 테스트는 가짜를 넘긴다 */
export type PhotoUploader = (
  file: File,
  workId: string,
  onProgress: (progress: UploadProgress) => void,
) => Promise<{ src: string }>;

type PrepareUpload = (request: {
  workId: string;
  type: string;
  size: number;
}) => Promise<
  { ok: true; ticket: UploadTicket } | { ok: false; code: UploadFailureCode }
>;

export function createPhotoUploader(
  prepare: PrepareUpload,
  { shrink = shrinkPhoto, put = putWithProgress } = {},
): PhotoUploader {
  return async (file, workId, onProgress) => {
    const problem = checkPhotoFile(file);
    if (problem) throw new PhotoUploadError(problem);
    onProgress({ phase: "processing" });
    const photo = await shrink(file);
    let result;
    try {
      result = await prepare({
        workId,
        type: photo.type,
        size: photo.blob.size,
      });
    } catch {
      throw new PhotoUploadError("unavailable");
    }
    if (!result.ok) throw new PhotoUploadError(result.code);
    onProgress({ phase: "uploading", ratio: 0 });
    await put(result.ticket, photo.blob, (ratio) =>
      onProgress({ phase: "uploading", ratio }),
    );
    return { src: result.ticket.src };
  };
}
