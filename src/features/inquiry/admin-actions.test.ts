import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminInquiryRepository } from "@/application/inquiry/admin-inquiry-repository";
import type { Inquiry, InquiryId } from "@/domain/inquiry/inquiry";

// 관리자 문의 서버 액션. container 대신 포트만 지키는 가짜 저장소를 꽂고,
// 관리자 확인, redirect, revalidatePath, 서버 로그는 기록만 한다
const deps = vi.hoisted(() => ({
  admin: true,
  store: new Map<string, Inquiry>(),
  revalidated: [] as string[],
  fail: false,
}));

class Redirect extends Error {
  constructor(readonly url: string) {
    super(`redirect ${url}`);
  }
}

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: (path: string, type?: string) =>
    deps.revalidated.push(`${path}:${type}`),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Redirect(url);
  },
}));
vi.mock("@/features/admin-auth/queries", () => ({
  requireAdmin: async (returnTo: string) => {
    if (!deps.admin)
      throw new Redirect(`/admin/login?next=${encodeURIComponent(returnTo)}`);
    return { id: "a1", email: "admin@example.com" };
  },
}));
vi.mock("@/infrastructure/container", () => {
  const guard = () => {
    if (deps.fail) throw new Error("db down");
  };
  const repo: AdminInquiryRepository = {
    save: async (inquiry) => {
      guard();
      deps.store.set(inquiry.id, inquiry);
    },
    findById: async (id) => (guard(), deps.store.get(id) ?? null),
    findAll: async () => [...deps.store.values()],
    countByStatus: async () => ({ New: 0, Read: 0, Done: 0 }),
    findPage: async () => [],
    remove: async (id) => (guard(), deps.store.delete(id)),
  };
  return {
    container: {
      inquiry: {
        admin: async () => repo,
        clock: { now: () => new Date("2026-10-25T00:00:00Z") },
      },
    },
  };
});

const { changeInquiryStatusAction, deleteInquiryAction } =
  await import("./actions");

const id = "00000000-0000-4000-8000-00000000c001";
const stored: Inquiry = {
  id: id as InquiryId,
  firstName: "하늘",
  lastName: "김",
  email: "sky@example.com",
  phone: null,
  message: "비밀 메시지",
  receivedAt: new Date("2026-10-20T09:00:00Z"),
  status: { type: "New" },
} as Inquiry;

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [name, value] of Object.entries(entries)) data.append(name, value);
  return data;
};

// 액션은 항상 redirect 로 끝난다. 간 곳을 돌려준다
const redirectOf = async (run: () => Promise<unknown>) => {
  try {
    await run();
  } catch (error) {
    if (error instanceof Redirect) return error.url;
    throw error;
  }
  throw new Error("redirect 하지 않았다");
};

const logs = () => {
  const spies = ["info", "warn", "error"].map((level) =>
    vi.spyOn(console, level as "info").mockImplementation(() => {}),
  );
  return () =>
    spies
      .flatMap((spy) => spy.mock.calls)
      .map(String)
      .join("\n");
};

beforeEach(() => {
  deps.admin = true;
  deps.fail = false;
  deps.revalidated = [];
  deps.store = new Map([[id, stored]]);
  vi.restoreAllMocks();
});

describe("changeInquiryStatusAction", () => {
  it("바꾸고 상세로 (바꾼 동작 알림), 관리자 화면 캐시를 비운다", async () => {
    expect(
      await redirectOf(() =>
        changeInquiryStatusAction(form({ id, action: "markRead" })),
      ),
    ).toBe(`/admin/inquiries/${id}?notice=markRead`);
    expect(deps.store.get(id)?.status).toEqual({
      type: "Read",
      changedAt: new Date("2026-10-25T00:00:00Z"),
    });
    expect(deps.revalidated).toEqual(["/admin:layout"]);
  });

  it("두 탭: 이미 바뀐 문의에 오래된 버튼을 누르면 conflict 알림, 상태는 그대로", async () => {
    await redirectOf(() =>
      changeInquiryStatusAction(form({ id, action: "markRead" })),
    );
    const before = deps.store.get(id);
    expect(
      await redirectOf(() =>
        changeInquiryStatusAction(form({ id, action: "markRead" })),
      ),
    ).toBe(`/admin/inquiries/${id}?notice=conflict`);
    expect(deps.store.get(id)).toBe(before);
    // 개수와 메뉴는 다시 그려야 맞는다 (다른 탭이 바꾼 결과)
    expect(deps.revalidated).toHaveLength(2);
  });

  it("다른 탭에서 지운 문의는 목록 + notFound", async () => {
    deps.store.clear();
    expect(
      await redirectOf(() =>
        changeInquiryStatusAction(form({ id, action: "markRead" })),
      ),
    ).toBe("/admin/inquiries?notice=notFound");
  });

  it("모르는 동작은 저장하지 않고 malformed", async () => {
    const read = logs();
    expect(
      await redirectOf(() =>
        changeInquiryStatusAction(form({ id, action: "delete" })),
      ),
    ).toBe(`/admin/inquiries/${id}?notice=malformed`);
    expect(deps.store.get(id)).toBe(stored);
    expect(read()).toContain(id);
  });

  it("id 가 없으면 목록 + notFound", async () => {
    expect(
      await redirectOf(() =>
        changeInquiryStatusAction(form({ action: "markRead" })),
      ),
    ).toBe("/admin/inquiries?notice=notFound");
  });

  it("세션이 끝났으면 바꾸지 않고 로그인 뒤 그 문의로", async () => {
    deps.admin = false;
    expect(
      await redirectOf(() =>
        changeInquiryStatusAction(form({ id, action: "markRead" })),
      ),
    ).toBe(`/admin/login?next=${encodeURIComponent(`/admin/inquiries/${id}`)}`);
    expect(deps.store.get(id)).toBe(stored);
  });

  it("저장소 장애는 상세 + unavailable. 로그에는 id 만 있고 개인정보는 없다", async () => {
    deps.fail = true;
    const read = logs();
    expect(
      await redirectOf(() =>
        changeInquiryStatusAction(form({ id, action: "markRead" })),
      ),
    ).toBe(`/admin/inquiries/${id}?notice=unavailable`);
    const text = read();
    expect(text).toContain(id);
    for (const secret of ["하늘", "sky@example.com", "비밀 메시지"])
      expect(text).not.toContain(secret);
  });
});

describe("deleteInquiryAction", () => {
  it("지우고 목록 + deleted. 로그에 개인정보가 없다", async () => {
    const read = logs();
    expect(await redirectOf(() => deleteInquiryAction(form({ id })))).toBe(
      "/admin/inquiries?notice=deleted",
    );
    expect(deps.store.has(id)).toBe(false);
    expect(deps.revalidated).toEqual(["/admin:layout"]);
    for (const secret of ["하늘", "sky@example.com", "비밀 메시지"])
      expect(read()).not.toContain(secret);
  });

  it("이미 지웠으면 목록 + notFound", async () => {
    await redirectOf(() => deleteInquiryAction(form({ id })));
    expect(await redirectOf(() => deleteInquiryAction(form({ id })))).toBe(
      "/admin/inquiries?notice=notFound",
    );
  });

  it("세션이 끝났으면 지우지 않는다", async () => {
    deps.admin = false;
    expect(await redirectOf(() => deleteInquiryAction(form({ id })))).toMatch(
      /^\/admin\/login\?next=/,
    );
    expect(deps.store.has(id)).toBe(true);
  });

  it("저장소 장애는 상세 + unavailable", async () => {
    deps.fail = true;
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await redirectOf(() => deleteInquiryAction(form({ id })))).toBe(
      `/admin/inquiries/${id}?notice=unavailable`,
    );
  });
});
