import { describe, expect, it } from "vitest";
import type { LocalizedText } from "@/domain/works/localized-text";
import { createWork, type Work, type WorkInput } from "@/domain/works/work";
import type { AdminWorkRepository } from "./admin-work-repository";
import { getAdminWork, listAdminWorks } from "./admin-works";
import { cleanUpPhotos, orphanPhotoGraceMs } from "./clean-up-photos";
import { deleteWork } from "./delete-work";
import { photoLimits } from "./photo-limits";
import type { PhotoStorage, StoredPhoto } from "./photo-storage";
import { preparePhotoUpload } from "./prepare-photo-upload";
import { saveWork, type SaveWorkInput } from "./save-work";

// 포트만 지키는 가짜. application 은 infrastructure 를 import 할 수 없어 여기 둔다
const storageBase = "https://cdn.test/works/";
const now = new Date("2026-10-24T12:00:00Z");
const clock = { now: () => now };
const hoursAgo = (hours: number) =>
  new Date(now.getTime() - hours * 60 * 60 * 1000);

const fakeRepo = (initial: Work[], fail?: "read" | "save") => {
  const store = new Map(initial.map((w) => [w.id as string, w]));
  const down = (kind: typeof fail) => {
    if (fail === kind) throw new Error("db down");
  };
  const repo: AdminWorkRepository = {
    findAll: async () => (down("read"), [...store.values()]),
    findBySlug: async (slug) => (
      down("read"),
      [...store.values()].find((w) => w.slug === slug) ?? null
    ),
    findById: async (id) => (down("read"), store.get(id) ?? null),
    save: async (work) => {
      down("save");
      const taken = [...store.values()].some(
        (w) => w.slug === work.slug && w.id !== work.id,
      );
      if (taken) return "slug-taken";
      store.set(work.id, work);
      return "saved";
    },
    remove: async (id) => {
      down("save");
      store.delete(id);
    },
  };
  return { repo, store };
};

const fakeStorage = (files: StoredPhoto[] = [], fail?: "remove") => {
  const stored = new Map(files.map((f) => [f.path, f]));
  const calls = { createUpload: [] as string[], remove: [] as string[][] };
  const storage: PhotoStorage = {
    createUpload: async (path, type) => {
      calls.createUpload.push(path);
      stored.set(path, { path, createdAt: now });
      return {
        url: `https://upload.test/${path}`,
        headers: { "content-type": type },
        src: `${storageBase}${path}`,
      };
    },
    pathOf: (src) =>
      src.startsWith(storageBase) ? src.slice(storageBase.length) : null,
    list: async () => [...stored.values()],
    remove: async (paths) => {
      calls.remove.push([...paths]);
      if (fail === "remove") throw new Error("storage down");
      for (const path of paths) stored.delete(path);
    },
  };
  return { storage, calls, paths: () => [...stored.keys()].sort() };
};

const alt = (text: string): LocalizedText => ({ ko: text, en: text });
const stored = (path: string, createdAt = now): StoredPhoto => ({
  path,
  createdAt,
});
const src = (path: string) => `${storageBase}${path}`;

const work = (input: Partial<WorkInput> & Pick<WorkInput, "id">): Work => {
  const images = input.images ?? [
    { src: `/images/works/${input.id}-1.jpg`, alt: alt("1"), order: 0 },
  ];
  const result = createWork({
    slug: input.id,
    title: { ko: input.id, en: input.id },
    category: "portrait",
    date: "2022-03",
    coverSrc: images[0]!.src,
    published: true,
    ...input,
    images,
  });
  if (!result.ok) throw new Error(result.error.type);
  return result.value;
};

// 시드 작업(로컬 사진)과 Storage 사진 작업
const seed = work({ id: "work-01", date: "2020-01" });
const uploaded = work({
  id: "w-2",
  date: "2023-05",
  images: [
    { src: src("w-2/a.jpg"), alt: alt("a"), order: 0 },
    { src: src("w-2/b.jpg"), alt: alt("b"), order: 1 },
  ],
});

const input = (patch: Partial<SaveWorkInput> = {}): SaveWorkInput => ({
  id: "new-1",
  isNew: true,
  slug: "fresh-work",
  title: { ko: " 새 작업 ", en: "Fresh Work" },
  category: "events",
  date: "2024-02",
  published: false,
  photos: [
    { src: src("new-1/x.jpg"), alt: { ko: " 첫 장 ", en: "First" } },
    { src: src("new-1/y.jpg"), alt: alt("") },
  ],
  coverSrc: src("new-1/y.jpg"),
  ...patch,
});

describe("saveWork", () => {
  const setup = (files: StoredPhoto[] = [], fail?: "read" | "save") => {
    const db = fakeRepo([seed, uploaded], fail);
    const files_ = fakeStorage(files);
    return {
      ...db,
      ...files_,
      save: saveWork({ repo: db.repo, storage: files_.storage, clock }),
    };
  };

  it("새 작업: 사진 순서는 보낸 순서, 대표는 coverSrc, 글자 앞뒤 공백은 지운다", async () => {
    const { save, store } = setup([
      stored("new-1/x.jpg"),
      stored("new-1/y.jpg"),
    ]);
    const result = await save(input());
    expect(result.ok).toBe(true);
    const saved = store.get("new-1")!;
    expect(saved).toMatchObject({
      slug: "fresh-work",
      title: { ko: "새 작업", en: "Fresh Work" },
      published: false,
      cover: { src: src("new-1/y.jpg"), order: 1 },
    });
    expect(saved.images.map((i) => [i.src, i.order, i.alt.ko])).toEqual([
      [src("new-1/x.jpg"), 0, "첫 장"],
      [src("new-1/y.jpg"), 1, ""],
    ]);
  });

  it("고치기: 공개 전환, 사진 순서 변경, 대표 변경", async () => {
    const { save, store } = setup([stored("w-2/a.jpg"), stored("w-2/b.jpg")]);
    const result = await save(
      input({
        id: "w-2",
        isNew: false,
        slug: "w-2",
        published: true,
        photos: [
          { src: src("w-2/b.jpg"), alt: alt("b") },
          { src: src("w-2/a.jpg"), alt: alt("a") },
        ],
        coverSrc: src("w-2/a.jpg"),
      }),
    );
    expect(result.ok).toBe(true);
    const saved = store.get("w-2")!;
    expect(saved.published).toBe(true);
    expect(saved.images.map((i) => i.src)).toEqual([
      src("w-2/b.jpg"),
      src("w-2/a.jpg"),
    ]);
    expect(saved.cover.order).toBe(1);
  });

  it("뺀 사진과 올리고 쓰지 않은 사진은 저장 뒤 바로 지운다 (이 작업 폴더만)", async () => {
    const { save, paths } = setup([
      stored("w-2/a.jpg"),
      stored("w-2/b.jpg"),
      stored("w-2/unused.jpg"),
      // 다른 탭에서 새 작업에 올리는 중인 사진은 남긴다
      stored("draft-9/p.jpg"),
    ]);
    const result = await save(
      input({
        id: "w-2",
        isNew: false,
        slug: "w-2",
        photos: [{ src: src("w-2/b.jpg"), alt: alt("b") }],
        coverSrc: src("w-2/b.jpg"),
      }),
    );
    expect(result.ok && result.value.removedPhotos).toEqual([
      "w-2/a.jpg",
      "w-2/unused.jpg",
    ]);
    expect(paths()).toEqual(["draft-9/p.jpg", "w-2/b.jpg"]);
  });

  it("시드 작업의 로컬 사진과 새로 올린 사진을 섞어 쓸 수 있다 (로컬 사진은 지우지 않는다)", async () => {
    const { save, store, calls } = setup([stored("work-01/new.jpg")]);
    const result = await save(
      input({
        id: "work-01",
        isNew: false,
        slug: "work-01",
        photos: [
          { src: src("work-01/new.jpg"), alt: alt("new") },
          { src: seed.images[0]!.src, alt: alt("seed") },
        ],
        coverSrc: seed.images[0]!.src,
      }),
    );
    expect(result.ok).toBe(true);
    expect(store.get("work-01")!.cover.src).toBe("/images/works/work-01-1.jpg");
    expect(calls.remove).toEqual([]);
  });

  it("틀린 칸은 한 번에 모두 돌려주고 저장하지 않는다", async () => {
    const { save, store } = setup();
    const result = await save(
      input({
        slug: "Not A Slug",
        title: { ko: "", en: " " },
        category: "food",
        date: "2024",
        photos: [],
      }),
    );
    expect(result).toEqual({
      ok: false,
      error: {
        type: "InvalidWork",
        fields: {
          slug: { type: "InvalidSlug", value: "Not A Slug" },
          titleKo: { type: "EmptyTitle", locale: "ko" },
          titleEn: { type: "EmptyTitle", locale: "en" },
          category: { type: "InvalidCategory", value: "food" },
          date: { type: "InvalidYearMonth", value: "2024" },
          images: { type: "CoverNotInImages", src: src("new-1/y.jpg") },
        },
      },
    });
    expect(store.has("new-1")).toBe(false);
  });

  it("다른 작업의 slug 면 SlugTaken (다른 칸 오류와 같이)", async () => {
    const { save } = setup();
    const result = await save(input({ slug: "w-2", date: "x" }));
    expect(!result.ok && result.error).toEqual({
      type: "InvalidWork",
      fields: {
        slug: { type: "SlugTaken" },
        date: { type: "InvalidYearMonth", value: "x" },
      },
    });
  });

  it("자기 slug 는 그대로 써도 된다", async () => {
    const { save } = setup();
    const result = await save(
      input({
        id: "w-2",
        isNew: false,
        slug: "w-2",
        photos: [{ src: src("w-2/a.jpg"), alt: alt("") }],
        coverSrc: src("w-2/a.jpg"),
      }),
    );
    expect(result.ok).toBe(true);
  });

  it("저장소가 저장 직전에 slug 중복을 알려도 SlugTaken", async () => {
    const { repo } = fakeRepo([seed]);
    const { storage } = fakeStorage();
    const result = await saveWork({
      repo: {
        ...repo,
        findBySlug: async () => null,
        save: async () => "slug-taken",
      },
      storage,
      clock,
    })(input());
    expect(!result.ok && result.error).toEqual({
      type: "InvalidWork",
      fields: { slug: { type: "SlugTaken" } },
    });
  });

  it.each([
    ["다른 작업 폴더의 사진", src("w-2/a.jpg")],
    ["바깥 주소", "https://evil.example/x.jpg"],
    ["다른 작업의 로컬 사진", "/images/works/work-01-1.jpg"],
  ])("%s 는 UnknownPhoto", async (_, photo) => {
    const { save } = setup();
    const result = await save(
      input({ photos: [{ src: photo, alt: alt("") }], coverSrc: photo }),
    );
    expect(!result.ok && result.error).toEqual({
      type: "InvalidWork",
      fields: { images: { type: "UnknownPhoto", src: photo } },
    });
  });

  it(`사진이 ${photoLimits.perWork}장을 넘으면 TooManyPhotos`, async () => {
    const { save } = setup();
    const photos = Array.from({ length: photoLimits.perWork + 1 }, (_, i) => ({
      src: src(`new-1/${i}.jpg`),
      alt: alt(""),
    }));
    const result = await save(input({ photos, coverSrc: photos[0]!.src }));
    expect(!result.ok && result.error).toEqual({
      type: "InvalidWork",
      fields: { images: { type: "TooManyPhotos", max: photoLimits.perWork } },
    });
  });

  it("새 작업인데 id 가 이미 있으면 AlreadyExists (두 번 제출)", async () => {
    const { save } = setup();
    expect(await save(input({ id: "w-2" }))).toEqual({
      ok: false,
      error: { type: "AlreadyExists", id: "w-2" },
    });
  });

  it.each(["gone", "../etc", "W-2", ""])(
    "고칠 작업 %j 가 없거나 형식이 틀리면 NotFound",
    async (id) => {
      const { save } = setup();
      expect(await save(input({ id, isNew: false }))).toEqual({
        ok: false,
        error: { type: "NotFound", id },
      });
    },
  );

  it("저장소 장애 → StorageFailed", async () => {
    for (const fail of ["read", "save"] as const) {
      const { save } = setup([], fail);
      const result = await save(input());
      expect(!result.ok && result.error.type).toBe("StorageFailed");
    }
  });

  it("파일 정리가 실패해도 저장은 성공, 경고를 돌려준다", async () => {
    const db = fakeRepo([uploaded]);
    const { storage } = fakeStorage(
      [stored("w-2/a.jpg"), stored("w-2/b.jpg")],
      "remove",
    );
    const result = await saveWork({ repo: db.repo, storage, clock })(
      input({
        id: "w-2",
        isNew: false,
        slug: "w-2",
        photos: [{ src: src("w-2/a.jpg"), alt: alt("") }],
        coverSrc: src("w-2/a.jpg"),
      }),
    );
    expect(result.ok && result.value.warnings).toEqual([
      { type: "PhotoCleanUpFailed", cause: new Error("storage down") },
    ]);
    expect(db.store.get("w-2")!.images).toHaveLength(1);
  });
});

describe("deleteWork", () => {
  it("작업을 지우고 그 작업 폴더의 파일도 지운다", async () => {
    const db = fakeRepo([seed, uploaded]);
    const files = fakeStorage([
      stored("w-2/a.jpg"),
      stored("w-2/b.jpg"),
      stored("work-01/keep.jpg", hoursAgo(1)),
    ]);
    const result = await deleteWork({
      repo: db.repo,
      storage: files.storage,
      clock,
    })("w-2");
    expect(result.ok && result.value.removedPhotos).toEqual([
      "w-2/a.jpg",
      "w-2/b.jpg",
    ]);
    expect(db.store.has("w-2")).toBe(false);
    expect(files.paths()).toEqual(["work-01/keep.jpg"]);
  });

  it("시드 작업(로컬 사진)을 지워도 public 파일은 건드리지 않는다", async () => {
    const db = fakeRepo([seed]);
    const files = fakeStorage();
    const result = await deleteWork({
      repo: db.repo,
      storage: files.storage,
      clock,
    })("work-01");
    expect(result.ok).toBe(true);
    expect(files.calls.remove).toEqual([]);
  });

  it.each(["nope", "../w-2"])("없는 작업 %j 는 NotFound", async (id) => {
    const db = fakeRepo([uploaded]);
    const result = await deleteWork({
      repo: db.repo,
      storage: fakeStorage().storage,
      clock,
    })(id);
    expect(result).toEqual({ ok: false, error: { type: "NotFound", id } });
  });

  it("작업을 못 지우면 파일도 지우지 않는다 (StorageFailed)", async () => {
    const db = fakeRepo([uploaded], "save");
    const files = fakeStorage([stored("w-2/a.jpg")]);
    const result = await deleteWork({
      repo: db.repo,
      storage: files.storage,
      clock,
    })("w-2");
    expect(!result.ok && result.error.type).toBe("StorageFailed");
    expect(files.calls.remove).toEqual([]);
  });

  it("파일 정리가 실패해도 작업은 지워지고 경고", async () => {
    const db = fakeRepo([uploaded]);
    const files = fakeStorage([stored("w-2/a.jpg")], "remove");
    const result = await deleteWork({
      repo: db.repo,
      storage: files.storage,
      clock,
    })("w-2");
    expect(result.ok && result.value.warnings[0]?.type).toBe(
      "PhotoCleanUpFailed",
    );
    expect(db.store.has("w-2")).toBe(false);
  });
});

describe("cleanUpPhotos", () => {
  it("다른 폴더의 쓰이지 않는 파일은 하루가 지난 것만 지운다", async () => {
    const db = fakeRepo([uploaded]);
    const old = hoursAgo(orphanPhotoGraceMs / 3_600_000 + 1);
    const files = fakeStorage([
      stored("w-2/a.jpg", old),
      stored("abandoned/old.jpg", old),
      stored("draft/recent.jpg", hoursAgo(2)),
    ]);
    expect(
      await cleanUpPhotos({ repo: db.repo, storage: files.storage, clock })(),
    ).toEqual(["abandoned/old.jpg"]);
    expect(files.paths()).toEqual(["draft/recent.jpg", "w-2/a.jpg"]);
  });

  it("지울 것이 없으면 저장소에 지우기를 보내지 않는다", async () => {
    const files = fakeStorage([stored("w-2/a.jpg")]);
    await cleanUpPhotos({
      repo: fakeRepo([uploaded]).repo,
      storage: files.storage,
      clock,
    })({
      workId: "w-2",
    });
    expect(files.calls.remove).toEqual([]);
  });
});

describe("preparePhotoUpload", () => {
  const ids = { next: () => "f00d" };
  const prepare = (storage = fakeStorage().storage) =>
    preparePhotoUpload({ storage, ids });

  it("작업 폴더 안에 서버가 정한 이름으로 올릴 곳을 만든다", async () => {
    const files = fakeStorage();
    const result = await prepare(files.storage)({
      workId: "new-1",
      type: "image/webp",
      size: 1024,
    });
    expect(result).toEqual({
      ok: true,
      value: {
        url: "https://upload.test/new-1/f00d.webp",
        headers: { "content-type": "image/webp" },
        src: src("new-1/f00d.webp"),
      },
    });
  });

  it.each([
    [{ workId: "../x" }, { type: "InvalidWorkId" }],
    [
      { type: "image/gif" },
      { type: "UnsupportedPhotoType", value: "image/gif" },
    ],
    [
      { type: "image/heic" },
      { type: "UnsupportedPhotoType", value: "image/heic" },
    ],
    [{ size: 0 }, { type: "PhotoTooLarge", max: photoLimits.uploadBytes }],
    [
      { size: photoLimits.uploadBytes + 1 },
      { type: "PhotoTooLarge", max: photoLimits.uploadBytes },
    ],
  ])("%j → %j", async (patch, error) => {
    const files = fakeStorage();
    const result = await prepare(files.storage)({
      workId: "new-1",
      type: "image/jpeg",
      size: 1024,
      ...patch,
    });
    expect(result).toEqual({ ok: false, error });
    expect(files.calls.createUpload).toEqual([]);
  });

  it("저장소 장애 → StorageFailed", async () => {
    const { storage } = fakeStorage();
    const result = await prepare({
      ...storage,
      createUpload: async () => {
        throw new Error("storage down");
      },
    })({ workId: "new-1", type: "image/jpeg", size: 1 });
    expect(!result.ok && result.error.type).toBe("StorageFailed");
  });
});

describe("관리자 목록과 편집", () => {
  it("listAdminWorks 는 비공개 포함, 최신순", async () => {
    const hidden = work({ id: "hidden", date: "2025-01", published: false });
    const { repo } = fakeRepo([seed, hidden, uploaded]);
    expect((await listAdminWorks({ repo })()).map((w) => w.id)).toEqual([
      "hidden",
      "w-2",
      "work-01",
    ]);
  });

  it("getAdminWork 는 형식이 틀린 id 를 저장소에 묻지 않고 null", async () => {
    const { repo } = fakeRepo([uploaded]);
    expect(await getAdminWork({ repo })("w-2")).toEqual(uploaded);
    expect(await getAdminWork({ repo })("nope")).toBeNull();
    expect(
      await getAdminWork({
        repo: {
          ...repo,
          findById: async () => {
            throw new Error("물으면 안 된다");
          },
        },
      })("../x"),
    ).toBeNull();
  });
});
