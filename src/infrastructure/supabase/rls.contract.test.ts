import { beforeAll, describe, expect, it } from "vitest";
import {
  restoreInquiry,
  type Inquiry,
  type InquiryId,
} from "@/domain/inquiry/inquiry";
import { createWork, type Work, type WorkInput } from "@/domain/works/work";
import { toInquiryRow } from "../inquiry/supabase-inquiry-mapper";
import { replaceAllInquiries } from "../inquiry/supabase-inquiry-writer";
import { toWorkRows } from "../works/supabase-work-mapper";
import { replaceAllWorks } from "../works/supabase-work-writer";
import {
  hasSupabaseEnv,
  publishableClient,
  secretClient,
} from "./contract-support";

// publishable 키(브라우저에 노출되는 키, anon 역할)로 할 수 있는 것과 없는 것 (supabase/migrations 의 RLS).
// 공개 작업과 그 사진만 읽고, 비공개 작업과 문의는 보이지 않으며, 어떤 테이블에도 쓰지 못한다
const PERMISSION_DENIED = "42501";

const work = (input: Pick<WorkInput, "id" | "slug" | "published">): Work => {
  const result = createWork({
    ...input,
    title: { ko: input.slug, en: input.slug },
    category: "portrait",
    date: "2022-03",
    updatedAt: new Date("2026-10-01T00:00:00Z"),
    coverSrc: `/${input.slug}/0.jpg`,
    images: [0, 1].map((order) => ({
      src: `/${input.slug}/${order}.jpg`,
      alt: { ko: "", en: "" },
      order,
    })),
  });
  if (!result.ok) throw new Error(result.error.type);
  return result.value;
};

const visible = work({ id: "rls-public", slug: "rls-public", published: true });
const hidden = work({
  id: "rls-private",
  slug: "rls-private",
  published: false,
});

const inquiry: Inquiry = (() => {
  const result = restoreInquiry(
    {
      firstName: "하늘",
      lastName: "김",
      email: "sky@example.com",
      message: "RLS 확인용 문의",
    },
    {
      id: "00000000-0000-4000-8000-0000000000a1" as InquiryId,
      receivedAt: new Date("2026-10-24T09:00:00Z"),
      status: { type: "New" },
    },
  );
  if (!result.ok) throw new Error(result.error.type);
  return result.value;
})();

describe.skipIf(!hasSupabaseEnv)("RLS: publishable 키", () => {
  // 건너뛸 때도 describe 본문은 실행되므로 클라이언트는 beforeAll 에서 만든다
  let anon: ReturnType<typeof publishableClient>;
  let admin: ReturnType<typeof secretClient>;

  beforeAll(async () => {
    anon = publishableClient();
    admin = secretClient();
    await replaceAllWorks(admin, [visible, hidden]);
    await replaceAllInquiries(admin, [inquiry]);
  });

  const workIds = async () =>
    (await admin.from("works").select("id, published").order("id")).data;

  describe("works / work_images 읽기", () => {
    it("공개 작업만 읽힌다", async () => {
      const { data, error } = await anon.from("works").select("id");
      expect(error).toBeNull();
      expect(data).toEqual([{ id: visible.id }]);
    });

    it("비공개 작업은 slug 로 직접 찾아도 없다", async () => {
      const { data, error } = await anon
        .from("works")
        .select("id")
        .eq("slug", hidden.slug);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("사진은 공개 작업의 것만 읽힌다 (비공개 작업 id 로 찾아도 없다)", async () => {
      const all = await anon.from("work_images").select("work_id, sort_order");
      expect(all.error).toBeNull();
      expect(all.data).toEqual(
        expect.arrayContaining([
          { work_id: visible.id, sort_order: 0 },
          { work_id: visible.id, sort_order: 1 },
        ]),
      );
      expect(all.data).toHaveLength(2);

      const direct = await anon
        .from("work_images")
        .select("work_id")
        .eq("work_id", hidden.id);
      expect(direct.data).toEqual([]);
    });
  });

  describe("works / work_images 쓰기", () => {
    it("작업 추가는 권한 없음", async () => {
      const intruder = toWorkRows(
        work({ id: "rls-new", slug: "rls-new", published: true }),
      );
      const { error } = await anon.from("works").insert(intruder.work);
      expect(error?.code).toBe(PERMISSION_DENIED);
    });

    it("공개 여부 변경, 삭제는 권한 없음", async () => {
      const update = await anon
        .from("works")
        .update({ published: true })
        .eq("id", hidden.id);
      expect(update.error?.code).toBe(PERMISSION_DENIED);
      const remove = await anon.from("works").delete().eq("id", visible.id);
      expect(remove.error?.code).toBe(PERMISSION_DENIED);
    });

    it("사진 추가, 대표 변경, 삭제는 권한 없음", async () => {
      const [first] = toWorkRows(visible).images;
      const insert = await anon
        .from("work_images")
        .insert({ ...first, sort_order: 9, is_cover: false });
      expect(insert.error?.code).toBe(PERMISSION_DENIED);
      const update = await anon
        .from("work_images")
        .update({ is_cover: false })
        .eq("work_id", visible.id);
      expect(update.error?.code).toBe(PERMISSION_DENIED);
      const remove = await anon
        .from("work_images")
        .delete()
        .eq("work_id", visible.id);
      expect(remove.error?.code).toBe(PERMISSION_DENIED);
    });

    it("위 시도 뒤에도 secret 키로 보면 그대로다", async () => {
      expect(await workIds()).toEqual([
        { id: hidden.id, published: false },
        { id: visible.id, published: true },
      ]);
      const images = await admin.from("work_images").select("work_id");
      expect(images.data).toHaveLength(4);
    });
  });

  describe("inquiries", () => {
    it("읽기는 권한 없음 (문의가 있어도 보이지 않는다)", async () => {
      const { data, error } = await anon.from("inquiries").select("id");
      expect(error?.code).toBe(PERMISSION_DENIED);
      expect(data).toBeNull();
    });

    it("쓰기(제출, 상태 변경, 삭제)는 권한 없음", async () => {
      const insert = await anon.from("inquiries").insert({
        ...toInquiryRow(inquiry),
        id: "00000000-0000-4000-8000-0000000000a2",
      });
      expect(insert.error?.code).toBe(PERMISSION_DENIED);
      const update = await anon
        .from("inquiries")
        .update({ status: "done" })
        .eq("id", inquiry.id);
      expect(update.error?.code).toBe(PERMISSION_DENIED);
      const remove = await anon.from("inquiries").delete().eq("id", inquiry.id);
      expect(remove.error?.code).toBe(PERMISSION_DENIED);
    });

    it("secret 키로는 읽히고, 위 시도 뒤에도 그대로다", async () => {
      const { data, error } = await admin
        .from("inquiries")
        .select("id, status");
      expect(error).toBeNull();
      expect(data).toEqual([{ id: inquiry.id, status: "new" }]);
    });
  });
});
