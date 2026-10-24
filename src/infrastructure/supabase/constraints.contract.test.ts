import { beforeAll, describe, expect, it } from "vitest";
import type { InquiryRow, WorkImageRow, WorkRow } from "./database";
import { replaceAllInquiries } from "../inquiry/supabase-inquiry-writer";
import { replaceAllWorks } from "../works/supabase-work-writer";
import { hasSupabaseEnv, secretClient } from "./contract-support";

// DB 제약은 domain 규칙의 두 번째 방어선이다 (docs/adr/0010). secret 키(RLS 우회)로 넣어도 막히는지 본다
const CHECK_VIOLATION = "23514";
const UNIQUE_VIOLATION = "23505";

const work: Omit<WorkRow, "created_at"> = {
  id: "constraint-work",
  slug: "constraint-work",
  title_ko: "제약",
  title_en: "Constraint",
  category: "portrait",
  year_month: "2022-03",
  published: true,
};
const image = (sort_order: number, is_cover: boolean): WorkImageRow => ({
  work_id: work.id,
  sort_order,
  src: `/c/${sort_order}.jpg`,
  alt_ko: "",
  alt_en: "",
  is_cover,
});
const inquiry: InquiryRow = {
  id: "00000000-0000-4000-8000-0000000000b1",
  first_name: "하늘",
  last_name: "김",
  email: "sky@example.com",
  phone: null,
  message: "제약 확인용 문의",
  received_at: "2026-10-24T09:00:00.000Z",
  status: "new",
  status_changed_at: null,
};

describe.skipIf(!hasSupabaseEnv)("DB 제약", () => {
  // 건너뛸 때도 describe 본문은 실행되므로 클라이언트는 beforeAll 에서 만든다
  let admin: ReturnType<typeof secretClient>;

  beforeAll(async () => {
    admin = secretClient();
    await replaceAllWorks(admin, []);
    await replaceAllInquiries(admin, []);
    const inserted = await admin.from("works").insert(work);
    expect(inserted.error).toBeNull();
  });

  it.each<[string, Partial<Omit<WorkRow, "created_at">>]>([
    ["slug 형식", { slug: "Not A Slug" }],
    ["카테고리", { category: "food" }],
    ["연월 형식", { year_month: "2022-13" }],
    ["빈 제목", { title_en: "  " }],
  ])("works: %s 를 어기면 거절", async (_, patch) => {
    const { error } = await admin.from("works").insert({
      ...work,
      id: "constraint-bad",
      slug: "constraint-bad",
      ...patch,
    });
    expect(error?.code).toBe(CHECK_VIOLATION);
  });

  it("work_images: 대표 이미지는 작업마다 하나, 순서는 겹치지 않고 0 이상", async () => {
    expect(
      (
        await admin
          .from("work_images")
          .insert([image(0, true), image(1, false)])
      ).error,
    ).toBeNull();
    expect(
      (await admin.from("work_images").insert(image(2, true))).error?.code,
    ).toBe(UNIQUE_VIOLATION);
    expect(
      (await admin.from("work_images").insert(image(1, false))).error?.code,
    ).toBe(UNIQUE_VIOLATION);
    expect(
      (await admin.from("work_images").insert(image(-1, false))).error?.code,
    ).toBe(CHECK_VIOLATION);
  });

  it.each<[string, Partial<InquiryRow>]>([
    ["new 인데 상태 시각 있음", { status_changed_at: "2026-10-24T10:00:00Z" }],
    ["read 인데 상태 시각 없음", { status: "read" }],
    [
      "모르는 상태",
      { status: "archived", status_changed_at: "2026-10-24T10:00:00Z" },
    ],
    ["빈 이름", { first_name: " " }],
    ["이름 51자 (코드 포인트)", { first_name: "😀".repeat(51) }],
    ["메시지 2001자", { message: "가".repeat(2001) }],
    ["연락처 빈 문자열 (없으면 null)", { phone: "" }],
    ["이메일 형식", { email: "not-an-email" }],
  ])("inquiries: %s 이면 거절", async (_, patch) => {
    const { error } = await admin
      .from("inquiries")
      .insert({ ...inquiry, ...patch });
    expect(error?.code).toBe(CHECK_VIOLATION);
  });

  it("inquiries: 한도 안의 값은 들어간다 (이름 50자 이모지, 메시지 2000자)", async () => {
    const { error } = await admin.from("inquiries").insert({
      ...inquiry,
      first_name: "😀".repeat(50),
      message: "가".repeat(2000),
    });
    expect(error).toBeNull();
  });
});
