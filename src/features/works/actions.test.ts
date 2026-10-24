import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Work } from "@/domain/works/work";
import type { WorkFormValues } from "./schema";

// container 대신 포트만 지키는 가짜 저장소를 꽂는다 (features 는 infrastructure 를 import 할 수 없다).
// 관리자 여부, updateTag, redirect 는 기록만 한다
const deps = vi.hoisted(() => {
  const photo = (src: string) => ({ src, alt: { ko: "", en: "" }, order: 0 });
  const stored = (id: string, slug: string) =>
    ({
      id,
      slug,
      title: { ko: slug, en: slug },
      category: "portrait",
      date: "2022-03",
      cover: photo(`/images/works/${slug}-1.jpg`),
      images: [photo(`/images/works/${slug}-1.jpg`)],
      published: true,
    }) as unknown as Work;
  const works = new Map(
    [
      stored("work-01", "faces-of-resilience"),
      stored("work-02", "innocence-unveiled"),
    ].map((w) => [w.id as string, w]),
  );
  const files = new Map<string, Uint8Array>();
  const base = "/media/work-photos/";
  let n = 0;
  return {
    admin: true,
    updatedTags: [] as string[],
    works,
    files,
    repo: {
      findAll: async () => [...works.values()],
      findBySlug: async (slug: string) =>
        [...works.values()].find((w) => w.slug === slug) ?? null,
      findById: async (id: string) => works.get(id) ?? null,
      save: async (work: Work) => {
        if (
          [...works.values()].some(
            (w) => w.slug === work.slug && w.id !== work.id,
          )
        )
          return "slug-taken" as const;
        works.set(work.id, work);
        return "saved" as const;
      },
      remove: async (id: string) => void works.delete(id),
    },
    storage: {
      createUpload: async (path: string, type: string) => ({
        url: `/admin/uploads/${path}`,
        headers: { "content-type": type },
        src: `${base}${path}`,
      }),
      pathOf: (src: string) =>
        src.startsWith(base) ? src.slice(base.length) : null,
      list: async () =>
        [...files.keys()].map((path) => ({ path, createdAt: new Date() })),
      remove: async (paths: readonly string[]) => {
        for (const path of paths) files.delete(path);
      },
    },
    ids: { next: () => `file-${++n}` },
  };
});

class Redirect extends Error {
  constructor(readonly url: string) {
    super(`redirect ${url}`);
  }
}

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  updateTag: (tag: string) => deps.updatedTags.push(tag),
  cacheLife: () => {},
  cacheTag: () => {},
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Redirect(url);
  },
}));
vi.mock("@/features/admin-auth/queries", () => ({
  getAdmin: async () =>
    deps.admin ? { id: "a1", email: "admin@example.com" } : null,
  requireAdmin: async () => ({ id: "a1", email: "admin@example.com" }),
}));
vi.mock("@/infrastructure/container", () => ({
  container: {
    workRepository: deps.repo,
    works: {
      admin: async () => ({ repo: deps.repo, storage: deps.storage }),
      clock: { now: () => new Date() },
      ids: deps.ids,
      memoryPhotos: null,
    },
  },
}));

const { saveWorkAction, deleteWorkAction, preparePhotoUploadAction } =
  await import("./actions");
// 브라우저처럼: 올릴 곳을 받아 PUT 하고 src 를 쓴다
const upload = async (workId: string) => {
  const result = await preparePhotoUploadAction({
    workId,
    type: "image/jpeg",
    size: 3,
  });
  if (!result.ok) throw new Error(result.code);
  deps.files.set(
    result.ticket.url.slice("/admin/uploads/".length),
    new Uint8Array([1]),
  );
  return result.ticket.src;
};

const values = (patch: Partial<WorkFormValues> = {}): WorkFormValues => ({
  id: "new-work",
  isNew: true,
  titleKo: "새 작업",
  titleEn: "New Work",
  slug: "new-work",
  category: "portrait",
  date: "2024-05",
  published: true,
  photos: [],
  coverSrc: "",
  ...patch,
});

const redirectOf = async (promise: Promise<unknown>) => {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  if (!(error instanceof Redirect)) throw new Error("redirect 하지 않았다");
  return error.url;
};

beforeEach(() => {
  deps.admin = true;
  deps.updatedTags = [];
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("saveWorkAction", () => {
  it("저장하면 saved 와 공개 화면 캐시 비우기(updateTag works)", async () => {
    const src = await upload("new-work");
    const state = await saveWorkAction(
      values({ photos: [{ src, altKo: "", altEn: "" }], coverSrc: src }),
    );
    expect(state).toEqual({
      status: "saved",
      id: "new-work",
      slug: "new-work",
      published: true,
    });
    expect(deps.updatedTags).toEqual(["works"]);
    expect(deps.works.get("new-work")?.cover.src).toBe(src);
  });

  it("틀린 칸은 화면 코드로, 캐시는 그대로", async () => {
    const state = await saveWorkAction(
      values({
        id: "other-work",
        titleKo: " ",
        slug: "faces-of-resilience",
        date: "2024",
      }),
    );
    expect(state).toEqual({
      status: "invalid",
      errors: {
        titleKo: { code: "required" },
        slug: { code: "taken" },
        date: { code: "invalid" },
        photos: { code: "required" },
      },
    });
    expect(deps.updatedTags).toEqual([]);
  });

  it("세션이 끝났으면 저장하지 않고 signedOut (redirect 하지 않는다)", async () => {
    deps.admin = false;
    expect(await saveWorkAction(values({ id: "x-1" }))).toEqual({
      status: "error",
      code: "signedOut",
    });
  });

  it.each([
    null,
    "x",
    { ...values(), photos: "nope" },
    { ...values(), isNew: "yes" },
  ])("폼 형태가 아니면 malformed: %j", async (raw) => {
    expect(await saveWorkAction(raw)).toEqual({
      status: "error",
      code: "malformed",
    });
  });

  it("고칠 작업이 없으면 notFound", async () => {
    expect(await saveWorkAction(values({ id: "gone", isNew: false }))).toEqual({
      status: "error",
      code: "notFound",
    });
  });
});

describe("deleteWorkAction", () => {
  it("지우면 캐시를 비우고 목록으로", async () => {
    expect(await redirectOf(deleteWorkAction("work-02"))).toBe(
      "/admin?deleted=1",
    );
    expect(deps.updatedTags).toEqual(["works"]);
    expect(deps.works.has("work-02")).toBe(false);
  });

  it("없는 작업은 notFound, 세션이 끝났으면 signedOut", async () => {
    expect(await deleteWorkAction("gone")).toEqual({
      status: "error",
      code: "notFound",
    });
    deps.admin = false;
    expect(await deleteWorkAction("work-01")).toEqual({
      status: "error",
      code: "signedOut",
    });
  });
});

describe("preparePhotoUploadAction", () => {
  it("형식과 크기 오류는 화면 코드로", async () => {
    expect(
      await preparePhotoUploadAction({
        workId: "w-1",
        type: "image/gif",
        size: 1,
      }),
    ).toEqual({ ok: false, code: "unsupportedType" });
    expect(
      await preparePhotoUploadAction({
        workId: "w-1",
        type: "image/jpeg",
        size: 20 * 1024 * 1024,
      }),
    ).toEqual({ ok: false, code: "tooLarge" });
    expect(await preparePhotoUploadAction({ workId: "w-1" })).toEqual({
      ok: false,
      code: "malformed",
    });
  });

  it("세션이 끝났으면 signedOut", async () => {
    deps.admin = false;
    expect(
      await preparePhotoUploadAction({
        workId: "w-1",
        type: "image/jpeg",
        size: 1,
      }),
    ).toEqual({ ok: false, code: "signedOut" });
  });
});
