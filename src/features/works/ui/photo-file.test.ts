import { describe, expect, it, vi } from "vitest";
import { photoLimits } from "@/application/works/photo-limits";
import {
  checkPhotoFile,
  createPhotoUploader,
  fitWithin,
  hasTransparency,
  PhotoUploadError,
  type UploadProgress,
} from "./photo-file";

const mb = 1024 * 1024;

describe("checkPhotoFile", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("%s 는 받는다", (type) => {
    expect(checkPhotoFile({ type, size: 5 * mb })).toBeNull();
  });

  it.each(["image/heic", "image/gif", "application/pdf", ""])(
    "%j 는 unsupportedType",
    (type) => {
      expect(checkPhotoFile({ type, size: 1 })).toBe("unsupportedType");
    },
  );

  it("원본 한도(50MB)를 넘으면 tooLarge, 한도까지는 받는다", () => {
    const max = photoLimits.originalBytes;
    expect(checkPhotoFile({ type: "image/jpeg", size: max })).toBeNull();
    expect(checkPhotoFile({ type: "image/jpeg", size: max + 1 })).toBe(
      "tooLarge",
    );
  });
});

describe("fitWithin", () => {
  it.each([
    [6000, 4000, { width: 2400, height: 1600 }],
    [4000, 6000, { width: 1600, height: 2400 }],
    // 아주 긴 파노라마도 비율을 지킨다
    [12000, 1000, { width: 2400, height: 200 }],
    // 이미 작으면 그대로 (키우지 않는다)
    [1200, 800, { width: 1200, height: 800 }],
    [2400, 2400, { width: 2400, height: 2400 }],
  ])("%i×%i → %j", (width, height, expected) => {
    expect(fitWithin(width, height, 2400)).toEqual(expected);
  });
});

describe("hasTransparency", () => {
  it("알파가 하나라도 255 보다 작으면 true", () => {
    expect(hasTransparency(Uint8ClampedArray.from([1, 2, 3, 255]))).toBe(false);
    expect(
      hasTransparency(Uint8ClampedArray.from([1, 2, 3, 255, 0, 0, 0, 254])),
    ).toBe(true);
  });
});

describe("createPhotoUploader", () => {
  const file = (type = "image/jpeg", size = 3) =>
    new File([new Uint8Array(size)], "IMG_0001.jpg", { type });
  const shrunk = {
    blob: new Blob([new Uint8Array(2)]),
    type: "image/jpeg" as const,
  };
  const ticket = {
    url: "https://upload.test/w-1/f.jpg",
    headers: { "content-type": "image/jpeg" },
    src: "https://cdn.test/w-1/f.jpg",
  };

  it("줄인 파일의 형식과 크기로 올릴 곳을 받고, 진행률을 알리며 올린다", async () => {
    const prepare = vi.fn(async () => ({ ok: true as const, ticket }));
    const put = vi.fn(async (_t, _b, onProgress: (r: number) => void) => {
      onProgress(0.5);
      onProgress(1);
    });
    const progress: UploadProgress[] = [];
    const upload = createPhotoUploader(prepare, {
      shrink: async () => shrunk,
      put,
    });
    expect(await upload(file(), "w-1", (p) => progress.push(p))).toEqual({
      src: ticket.src,
    });
    expect(prepare).toHaveBeenCalledWith({
      workId: "w-1",
      type: "image/jpeg",
      size: 2,
    });
    expect(put).toHaveBeenCalledWith(ticket, shrunk.blob, expect.any(Function));
    expect(progress).toEqual([
      { phase: "processing" },
      { phase: "uploading", ratio: 0 },
      { phase: "uploading", ratio: 0.5 },
      { phase: "uploading", ratio: 1 },
    ]);
  });

  const codeOf = (promise: Promise<unknown>) =>
    promise.then(
      () => null,
      (error: unknown) =>
        error instanceof PhotoUploadError ? error.code : error,
    );

  it("형식이 틀리면 줄이지도 묻지도 않고 unsupportedType", async () => {
    const shrink = vi.fn();
    const prepare = vi.fn();
    const upload = createPhotoUploader(prepare, { shrink });
    expect(await codeOf(upload(file("image/heic"), "w-1", () => {}))).toBe(
      "unsupportedType",
    );
    expect(shrink).not.toHaveBeenCalled();
    expect(prepare).not.toHaveBeenCalled();
  });

  it("서버가 거절한 코드를 그대로 (signedOut 등), 서버에 닿지 못하면 unavailable", async () => {
    const shrink = async () => shrunk;
    expect(
      await codeOf(
        createPhotoUploader(async () => ({ ok: false, code: "signedOut" }), {
          shrink,
        })(file(), "w-1", () => {}),
      ),
    ).toBe("signedOut");
    expect(
      await codeOf(
        createPhotoUploader(
          async () => {
            throw new Error("network");
          },
          { shrink },
        )(file(), "w-1", () => {}),
      ),
    ).toBe("unavailable");
  });
});
