import { describe, expect, it } from "vitest";
import { createInMemoryPhotoStorage } from "./in-memory-photo-storage";
import { describePhotoStorageContract } from "./photo-storage.contract";

const tokenOf = (url: string) => url.split("/").pop()!;

describePhotoStorageContract(
  "인메모리",
  () => {
    const storage = createInMemoryPhotoStorage({
      clock: { now: () => new Date() },
    });
    return {
      storage,
      put: async (ticket, body, type = ticket.headers["content-type"]!) =>
        storage.receive(tokenOf(ticket.url), type, body) === "stored",
      get: async (src) => {
        const path = storage.pathOf(src);
        return (path && storage.read(path)?.body) || null;
      },
    };
  },
  "contract-memory",
);

describe("인메모리 업로드 토큰", () => {
  it("2시간이 지난 토큰과 모르는 토큰은 not-found", async () => {
    let now = new Date("2026-10-24T00:00:00Z");
    const storage = createInMemoryPhotoStorage({ clock: { now: () => now } });
    const ticket = await storage.createUpload("w-1/a.jpg", "image/jpeg");
    now = new Date("2026-10-24T02:00:01Z");
    const body = new Uint8Array([1]);
    expect(storage.receive(tokenOf(ticket.url), "image/jpeg", body)).toBe(
      "not-found",
    );
    expect(storage.receive("nope", "image/jpeg", body)).toBe("not-found");
  });

  it("사진 경로가 아니면 올릴 곳을 만들지 않는다", async () => {
    const storage = createInMemoryPhotoStorage({
      clock: { now: () => new Date() },
    });
    await expect(
      storage.createUpload("w-1/../w-2/a.jpg", "image/jpeg"),
    ).rejects.toThrow();
  });
});
