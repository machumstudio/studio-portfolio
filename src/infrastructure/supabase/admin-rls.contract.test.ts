import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  restoreInquiry,
  type Inquiry,
  type InquiryId,
} from "@/domain/inquiry/inquiry";
import { createWork, type Work } from "@/domain/works/work";
import { toInquiryRow } from "../inquiry/supabase-inquiry-mapper";
import { replaceAllInquiries } from "../inquiry/supabase-inquiry-writer";
import { toWorkRows } from "../works/supabase-work-mapper";
import { replaceAllWorks } from "../works/supabase-work-writer";
import {
  hasSupabaseEnv,
  publishableClient,
  secretClient,
} from "./contract-support";

// 관리자 권한 (supabase/migrations/*_admin_access.sql, docs/adr/0012).
// 로그인 세션(publishable 키 + 사용자 JWT)으로 무엇을 할 수 있는지 본다:
// - 공개 가입과 익명 로그인은 막혀 있다 (관리자 계정은 대시보드/admin API 로만 만든다)
// - app_metadata.role=admin 이 아닌 세션은 비공개 작업과 문의를 못 보고 못 바꾼다.
//   user_metadata.role 을 스스로 admin 으로 바꿔도 마찬가지다
// - 관리자 세션은 작업과 문의를 읽고 바꾼다. 새 문의 저장은 여전히 secret 키만 한다
// 계정은 실행마다 다른 임시 계정을 secret 키의 admin API 로 만들고 끝나면 지운다 (실제 관리자 계정은 쓰지 않는다)
const PERMISSION_DENIED = "42501";

const run = Math.random().toString(36).slice(2, 10);
const password = `rls-${run}-Passw0rd!`;

const work = (id: string, published: boolean): Work => {
  const result = createWork({
    id,
    slug: id,
    title: { ko: id, en: id },
    category: "portrait",
    date: "2022-03",
    coverSrc: `/${id}/0.jpg`,
    images: [{ src: `/${id}/0.jpg`, alt: { ko: "", en: "" }, order: 0 }],
    published,
  });
  if (!result.ok) throw new Error(result.error.type);
  return result.value;
};
const visible = work("admin-rls-public", true);
const hidden = work("admin-rls-private", false);

const inquiry: Inquiry = (() => {
  const result = restoreInquiry(
    {
      firstName: "하늘",
      lastName: "김",
      email: "sky@example.com",
      message: "관리자 RLS 확인용 문의",
    },
    {
      id: "00000000-0000-4000-8000-0000000000b1" as InquiryId,
      receivedAt: new Date("2026-10-24T09:00:00Z"),
      status: { type: "New" },
    },
  );
  if (!result.ok) throw new Error(result.error.type);
  return result.value;
})();

type Client = ReturnType<typeof publishableClient>;

describe.skipIf(!hasSupabaseEnv)("관리자 권한: 가입과 로그인 세션", () => {
  let service: ReturnType<typeof secretClient>;
  const userIds: string[] = [];

  // admin API 로 만든 임시 계정으로 로그인한 클라이언트 (브라우저 세션과 같은 권한)
  const signedIn = async (
    name: string,
    appMetadata: object,
  ): Promise<Client> => {
    const email = `rls-${name}-${run}@example.com`;
    const { data, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: appMetadata,
    });
    if (error) throw error;
    userIds.push(data.user.id);
    const client = publishableClient();
    const signIn = await client.auth.signInWithPassword({ email, password });
    if (signIn.error) throw signIn.error;
    return client;
  };

  let admin: Client;
  let editor: Client;
  let spoofer: Client;

  beforeAll(async () => {
    service = secretClient();
    await replaceAllWorks(service, [visible, hidden]);
    await replaceAllInquiries(service, [inquiry]);
    admin = await signedIn("admin", { role: "admin" });
    editor = await signedIn("editor", { role: "editor" });
    spoofer = await signedIn("spoofer", {});
    // 사용자가 스스로 고칠 수 있는 user_metadata 에 role=admin 을 넣고 토큰을 새로 받는다
    const update = await spoofer.auth.updateUser({ data: { role: "admin" } });
    if (update.error) throw update.error;
    const refresh = await spoofer.auth.refreshSession();
    if (refresh.error) throw refresh.error;
  });

  afterAll(async () => {
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  const snapshot = async () => ({
    works: (await service.from("works").select("id, published").order("id"))
      .data,
    images: (
      await service.from("work_images").select("work_id").order("work_id")
    ).data,
    inquiries: (await service.from("inquiries").select("id, status")).data,
  });
  const initial = {
    works: [
      { id: hidden.id, published: false },
      { id: visible.id, published: true },
    ],
    images: [{ work_id: hidden.id }, { work_id: visible.id }],
    inquiries: [{ id: inquiry.id, status: "new" }],
  };

  describe("가입", () => {
    it("공개 가입은 막혀 있다 (계정이 생기지 않는다)", async () => {
      const email = `rls-signup-${run}@example.com`;
      const { data, error } = await publishableClient().auth.signUp({
        email,
        password,
      });
      if (data.user) userIds.push(data.user.id);
      expect(error?.code).toBe("signup_disabled");
      const users = await service.auth.admin.listUsers();
      expect(users.data.users.map((u) => u.email)).not.toContain(email);
    });

    it("익명 로그인은 막혀 있다 (authenticated 세션을 아무나 얻지 못한다)", async () => {
      const { data, error } =
        await publishableClient().auth.signInAnonymously();
      if (data.user) userIds.push(data.user.id);
      expect(error?.code).toBe("anonymous_provider_disabled");
      expect(data.session).toBeNull();
    });

    it("이메일 OTP 로도 새 계정이 생기지 않는다", async () => {
      const email = `rls-otp-${run}@example.com`;
      const { error } = await publishableClient().auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      expect(error).not.toBeNull();
      const users = await service.auth.admin.listUsers();
      expect(users.data.users.map((u) => u.email)).not.toContain(email);
    });
  });

  describe.each([
    ["publishable 키만 (로그인 안 함)", () => publishableClient()],
    ["관리자가 아닌 세션 (role=editor)", () => editor],
    ["user_metadata.role=admin 으로 바꾼 세션", () => spoofer],
  ])("%s", (_, client) => {
    it("비공개 작업과 그 사진이 보이지 않는다", async () => {
      const works = await client().from("works").select("id");
      expect(works.data).toEqual([{ id: visible.id }]);
      const images = await client()
        .from("work_images")
        .select("work_id")
        .eq("work_id", hidden.id);
      expect(images.data).toEqual([]);
    });

    it("문의가 보이지 않는다", async () => {
      const { data, error } = await client().from("inquiries").select("id");
      // anon 은 권한 자체가 없고(42501), authenticated 는 정책이 0행으로 거른다
      expect(error ? error.code : data).toEqual(error ? PERMISSION_DENIED : []);
    });

    it("작업 추가는 거부, 수정/삭제는 아무 행도 바꾸지 못한다", async () => {
      const rows = toWorkRows(work(`admin-rls-new-${run}`, true));
      const insert = await client().from("works").insert(rows.work);
      expect(insert.error?.code).toBe(PERMISSION_DENIED);
      await client()
        .from("works")
        .update({ published: true })
        .eq("id", hidden.id);
      await client().from("works").delete().eq("id", visible.id);
      await client().from("work_images").delete().eq("work_id", visible.id);
      expect(await snapshot()).toEqual(initial);
    });

    it("문의 추가는 거부, 상태 변경/삭제는 아무 행도 바꾸지 못한다", async () => {
      const insert = await client()
        .from("inquiries")
        .insert({
          ...toInquiryRow(inquiry),
          id: "00000000-0000-4000-8000-0000000000b2",
        });
      expect(insert.error?.code).toBe(PERMISSION_DENIED);
      await client()
        .from("inquiries")
        .update({ status: "done" })
        .eq("id", inquiry.id);
      await client().from("inquiries").delete().eq("id", inquiry.id);
      expect(await snapshot()).toEqual(initial);
    });
  });

  describe("관리자 세션 (app_metadata.role=admin)", () => {
    it("비공개 작업과 문의를 읽는다", async () => {
      const works = await admin.from("works").select("id").order("id");
      expect(works.data).toEqual([{ id: hidden.id }, { id: visible.id }]);
      const inquiries = await admin.from("inquiries").select("id, status");
      expect(inquiries.error).toBeNull();
      expect(inquiries.data).toEqual([{ id: inquiry.id, status: "new" }]);
    });

    it("작업을 추가/공개 전환/삭제한다", async () => {
      const added = toWorkRows(work(`admin-rls-added-${run}`, false));
      expect((await admin.from("works").insert(added.work)).error).toBeNull();
      expect(
        (await admin.from("work_images").insert(added.images)).error,
      ).toBeNull();
      const update = await admin
        .from("works")
        .update({ published: true })
        .eq("id", added.work.id)
        .select("published");
      expect(update.data).toEqual([{ published: true }]);
      const remove = await admin
        .from("works")
        .delete()
        .eq("id", added.work.id)
        .select("id");
      expect(remove.data).toEqual([{ id: added.work.id }]);
      expect(await snapshot()).toEqual(initial);
    });

    it("문의 상태를 바꾼다. 새 문의 저장은 거부 (secret 키만)", async () => {
      const update = await admin
        .from("inquiries")
        .update({ status: "read", status_changed_at: new Date().toISOString() })
        .eq("id", inquiry.id)
        .select("status");
      expect(update.data).toEqual([{ status: "read" }]);
      const insert = await admin.from("inquiries").insert({
        ...toInquiryRow(inquiry),
        id: "00000000-0000-4000-8000-0000000000b3",
      });
      expect(insert.error?.code).toBe(PERMISSION_DENIED);
    });
  });
});
