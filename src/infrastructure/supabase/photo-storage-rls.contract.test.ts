import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { workPhotosBucket } from "../works/supabase-photo-storage";
import {
  hasSupabaseEnv,
  publishableClient,
  secretClient,
  signedInClient,
} from "./contract-support";

// 작업 사진 버킷 권한 (supabase/migrations/*_work_photos_storage.sql, docs/adr/0012, 0014).
// - 관리자 세션만 올릴 곳(서명 업로드 주소)을 만들고, 목록을 보고, 지운다
// - 관리자가 아닌 세션(로그인 안 함, role=editor, user_metadata 를 admin 으로 바꾼 세션)은 모두 막힌다
// - 공개 버킷이라 사진 주소는 누구나 읽는다
// 계정과 파일은 실행마다 다르게 만들고 끝나면 지운다
const run = Math.random().toString(36).slice(2, 10);
const password = `rls-${run}-Passw0rd!`;
const folder = `rls-${run}`;
const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);

type Client = ReturnType<typeof publishableClient>;

describe.skipIf(!hasSupabaseEnv)("작업 사진 버킷 권한", () => {
  let service: ReturnType<typeof secretClient>;
  const userIds: string[] = [];
  let admin: Client;
  let editor: Client;
  let spoofer: Client;
  // 미리 secret 키로 올려 둔 사진 (지우기/목록 확인용)
  const existing = `${folder}/existing.jpg`;

  const account = (name: string, appMetadata: object) =>
    signedInClient(service, {
      email: `rls-photo-${name}-${run}@example.com`,
      password,
      appMetadata,
      userIds,
    });

  const exists = async (path: string) => {
    const { data } = await service.storage
      .from(workPhotosBucket)
      .list(folder, { search: path.split("/")[1] });
    return (data ?? []).some((file) => `${folder}/${file.name}` === path);
  };

  beforeAll(async () => {
    service = secretClient();
    const upload = await service.storage
      .from(workPhotosBucket)
      .upload(existing, jpeg, { contentType: "image/jpeg" });
    if (upload.error) throw upload.error;
    admin = await account("admin", { role: "admin" });
    editor = await account("editor", { role: "editor" });
    spoofer = await account("spoofer", {});
    const update = await spoofer.auth.updateUser({ data: { role: "admin" } });
    if (update.error) throw update.error;
    const refresh = await spoofer.auth.refreshSession();
    if (refresh.error) throw refresh.error;
  });

  afterAll(async () => {
    const { data } = await service.storage.from(workPhotosBucket).list(folder);
    await service.storage
      .from(workPhotosBucket)
      .remove((data ?? []).map((file) => `${folder}/${file.name}`));
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it("공개 버킷: 로그인 없이 사진 주소를 읽는다", async () => {
    const { publicUrl } = publishableClient()
      .storage.from(workPhotosBucket)
      .getPublicUrl(existing).data;
    const response = await fetch(publicUrl, { cache: "no-store" });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(jpeg);
  });

  describe.each([
    ["publishable 키만 (로그인 안 함)", () => publishableClient()],
    ["관리자가 아닌 세션 (role=editor)", () => editor],
    ["user_metadata.role=admin 으로 바꾼 세션", () => spoofer],
  ])("%s", (_, client) => {
    const bucket = () => client().storage.from(workPhotosBucket);

    it("올릴 곳을 만들지 못하고 바로 올리지도 못한다", async () => {
      const signed = await bucket().createSignedUploadUrl(`${folder}/new.jpg`);
      expect(signed.error).not.toBeNull();
      const direct = await bucket().upload(`${folder}/direct.jpg`, jpeg, {
        contentType: "image/jpeg",
      });
      expect(direct.error).not.toBeNull();
      expect(await exists(`${folder}/direct.jpg`)).toBe(false);
    });

    it("목록이 보이지 않는다", async () => {
      const { data } = await bucket().list(folder);
      expect(data ?? []).toEqual([]);
    });

    it("지우지 못한다", async () => {
      await bucket().remove([existing]);
      expect(await exists(existing)).toBe(true);
    });
  });

  describe("관리자 세션", () => {
    const bucket = () => admin.storage.from(workPhotosBucket);

    it("올릴 곳을 만들어 올리고, 목록에서 보고, 지운다", async () => {
      const path = `${folder}/admin.jpg`;
      const signed = await bucket().createSignedUploadUrl(path);
      expect(signed.error).toBeNull();
      const put = await fetch(signed.data!.signedUrl, {
        method: "PUT",
        headers: { "content-type": "image/jpeg" },
        body: jpeg,
      });
      expect(put.ok).toBe(true);
      const { data } = await bucket().list(folder);
      expect((data ?? []).map((file) => file.name)).toContain("admin.jpg");
      const removed = await bucket().remove([path]);
      expect(removed.error).toBeNull();
      expect(await exists(path)).toBe(false);
    });

    it("이미 있는 사진은 덮어쓰지 못한다", async () => {
      const update = await bucket().update(existing, new Uint8Array([1, 2]), {
        contentType: "image/jpeg",
      });
      expect(update.error).not.toBeNull();
      const upsert = await bucket().upload(existing, new Uint8Array([1, 2]), {
        contentType: "image/jpeg",
        upsert: true,
      });
      expect(upsert.error).not.toBeNull();
    });
  });
});
