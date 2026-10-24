import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { photoLimits, type PhotoType } from "@/application/works/photo-limits";
import { photoPath } from "@/application/works/photo-paths";
import type {
  PhotoStorage,
  UploadTicket,
} from "@/application/works/photo-storage";

/** 구현마다 다른 "브라우저 쪽" 동작: 올릴 곳에 PUT, 사진 주소에서 GET */
export type PhotoStorageHarness = {
  storage: PhotoStorage;
  /** 브라우저처럼 ticket 의 주소와 헤더로 PUT 한다. type 을 주면 content-type 을 바꿔 보낸다. 성공하면 true */
  put(
    ticket: UploadTicket,
    body: Uint8Array<ArrayBuffer>,
    type?: string,
  ): Promise<boolean>;
  /** 사진 주소의 내용. 없으면 null */
  get(src: string): Promise<Uint8Array | null>;
};

// PhotoStorage 계약 테스트. 구현마다 *.test.ts 에서 불러 같은 시나리오를 돌린다.
// 모든 파일은 folder(작업 id 자리) 아래에 올리고, 끝나면 그 폴더를 지운다 (클라우드 버킷의 다른 사진은 건드리지 않는다)
export function describePhotoStorageContract(
  name: string,
  setup: () => PhotoStorageHarness | Promise<PhotoStorageHarness>,
  folder: string,
) {
  describe(`PhotoStorage 계약: ${name}`, () => {
    let harness: PhotoStorageHarness;
    let n = 0;
    const path = (type: PhotoType = "image/jpeg") =>
      photoPath(folder, `file-${++n}`, type);
    const mine = async () =>
      (await harness.storage.list())
        .filter((photo) => photo.path.startsWith(`${folder}/`))
        .map((photo) => photo.path)
        .sort();

    beforeAll(async () => {
      harness = await setup();
    });

    afterAll(async () => {
      await harness.storage.remove(await mine());
    });

    it("createUpload → PUT → 사진 주소에서 같은 내용을 읽고 목록에 보인다", async () => {
      const target = path("image/png");
      const before = Date.now();
      const ticket = await harness.storage.createUpload(target, "image/png");
      expect(await harness.put(ticket, png)).toBe(true);
      expect(harness.storage.pathOf(ticket.src)).toBe(target);
      expect(await harness.get(ticket.src)).toEqual(png);
      const listed = (await harness.storage.list()).find(
        (photo) => photo.path === target,
      );
      expect(listed?.createdAt.getTime()).toBeGreaterThan(before - 60_000);
    });

    it("올릴 곳은 한 번만 쓰고, 이미 있는 경로는 덮어쓰지 않는다", async () => {
      const target = path();
      const ticket = await harness.storage.createUpload(target, "image/jpeg");
      expect(await harness.put(ticket, jpeg)).toBe(true);
      expect(await harness.put(ticket, png)).toBe(false);
      await expect(
        harness.storage.createUpload(target, "image/jpeg"),
      ).rejects.toThrow();
      expect(await harness.get(ticket.src)).toEqual(jpeg);
    });

    it("사진이 아닌 형식(text/html)은 받지 않는다 (공개 주소에서 페이지로 열리지 않게)", async () => {
      const ticket = await harness.storage.createUpload(path(), "image/jpeg");
      const html = new TextEncoder().encode("<script>alert(1)</script>");
      expect(await harness.put(ticket, html, "text/html")).toBe(false);
      expect(await harness.get(ticket.src)).toBeNull();
    });

    it(`${photoLimits.uploadBytes / 1024 / 1024}MB 를 넘는 파일은 받지 않는다`, async () => {
      const ticket = await harness.storage.createUpload(path(), "image/jpeg");
      const big = new Uint8Array(photoLimits.uploadBytes + 1);
      big.set(jpeg);
      expect(await harness.put(ticket, big)).toBe(false);
      expect(await harness.get(ticket.src)).toBeNull();
    });

    it("remove 는 주어진 파일만 지운다. 없는 경로는 무시한다", async () => {
      const [a, b] = [path(), path()];
      for (const target of [a, b])
        await harness.put(
          await harness.storage.createUpload(target, "image/jpeg"),
          jpeg,
        );
      await harness.storage.remove([
        a,
        photoPath(folder, "missing", "image/jpeg"),
      ]);
      const left = await mine();
      expect(left).toContain(b);
      expect(left).not.toContain(a);
    });

    it("pathOf: 이 저장소의 사진 주소만 경로로 되돌린다", async () => {
      const { src } = await harness.storage.createUpload(path(), "image/jpeg");
      const base = src.slice(0, src.indexOf(`${folder}/`));
      for (const other of [
        "/images/works/faces-of-resilience-1.jpg",
        "https://evil.example/x.jpg",
        `${base}${folder}/../other/a.jpg`,
        `${base}${folder}/a.gif`,
        `${base}../other-bucket/${folder}/a.jpg`,
      ])
        expect(harness.storage.pathOf(other)).toBeNull();
    });
  });
}

// 가장 작은 PNG(1x1)와 JPEG 머리. 저장소는 내용을 해석하지 않고 형식과 크기만 본다
const png = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64",
  ),
);
const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
