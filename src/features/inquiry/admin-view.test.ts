import { describe, expect, it } from "vitest";
import type { Inquiry, InquiryId } from "@/domain/inquiry/inquiry";
import { err, ok } from "@/shared/result";
import {
  deleteRedirect,
  inquiryDetailHref,
  inquiryListHref,
  messagePreview,
  parseDetailNotice,
  parseInquiryListParams,
  parseListNotice,
  replyMailto,
  statusChangeRedirect,
  toAdminInquiryDetailView,
  toAdminInquiryRow,
  type InquiryListParams,
} from "./admin-view";

const id = "00000000-0000-4000-8000-00000000c001";
const receivedAt = new Date("2026-10-20T09:00:00Z");
const changedAt = new Date("2026-10-21T01:00:00Z");
const inquiry = (status: Inquiry["status"]): Inquiry =>
  ({
    id: id as InquiryId,
    firstName: "하늘",
    lastName: "김",
    email: "sky@example.com",
    phone: null,
    message: "가족사진\n\n촬영 문의드립니다.",
    receivedAt,
    status,
  }) as Inquiry;

describe("parseInquiryListParams", () => {
  it.each<[Record<string, string | string[]>, InquiryListParams]>([
    [{}, { status: null, page: 1 }],
    [{ status: "new" }, { status: "New", page: 1 }],
    [
      { status: "read", page: "3" },
      { status: "Read", page: 3 },
    ],
    [
      { status: ["done", "new"], page: ["2"] },
      { status: "Done", page: 2 },
    ],
    [{ status: "New" }, { status: null, page: 1 }],
    [
      { status: "all", page: "-1" },
      { status: null, page: 1 },
    ],
    [{ page: "1.5" }, { status: null, page: 1 }],
    [{ page: "abc" }, { status: null, page: 1 }],
    [{ page: "99999999" }, { status: null, page: 1 }],
  ])("%j → %j", (params, expected) => {
    expect(parseInquiryListParams(params)).toEqual(expected);
  });
});

describe("주소", () => {
  it("목록: 전체 1페이지는 쿼리 없이, 필터/페이지/알림은 쿼리로", () => {
    expect(inquiryListHref({ status: null })).toBe("/admin/inquiries");
    expect(inquiryListHref({ status: "New", page: 2 })).toBe(
      "/admin/inquiries?status=new&page=2",
    );
    expect(inquiryListHref({ status: null, notice: "deleted" })).toBe(
      "/admin/inquiries?notice=deleted",
    );
  });

  it("상세: id 는 인코딩한다", () => {
    expect(inquiryDetailHref(id)).toBe(`/admin/inquiries/${id}`);
    expect(inquiryDetailHref("a/b?c", "conflict")).toBe(
      "/admin/inquiries/a%2Fb%3Fc?notice=conflict",
    );
  });

  it("알림은 아는 값만", () => {
    expect(parseDetailNotice("conflict")).toBe("conflict");
    expect(parseDetailNotice(["markRead"])).toBe("markRead");
    expect(parseDetailNotice("deleted")).toBeUndefined();
    expect(parseListNotice("deleted")).toBe("deleted");
    expect(parseListNotice("<script>")).toBeUndefined();
    expect(parseListNotice(undefined)).toBeUndefined();
  });
});

describe("statusChangeRedirect", () => {
  const changed = ok(inquiry({ type: "Read", changedAt }));
  it.each([
    ["성공: 바꾼 동작", changed, `/admin/inquiries/${id}?notice=markRead`],
    [
      "다른 탭이 먼저 바꿈 (InvalidTransition)",
      err({
        type: "InvalidTransition" as const,
        from: "Read" as const,
        action: "markRead" as const,
      }),
      `/admin/inquiries/${id}?notice=conflict`,
    ],
    [
      "없어짐 (다른 탭에서 지움)",
      err({ type: "NotFound" as const, id }),
      "/admin/inquiries?notice=notFound",
    ],
    [
      "저장소 장애",
      err({ type: "StorageFailed" as const, cause: new Error("db") }),
      `/admin/inquiries/${id}?notice=unavailable`,
    ],
  ])("%s", (_, result, href) => {
    expect(statusChangeRedirect(id, "markRead", result)).toBe(href);
  });
});

describe("deleteRedirect", () => {
  it("지우면 목록 + deleted, 이미 없으면 목록 + notFound, 장애면 상세 + unavailable", () => {
    expect(deleteRedirect(id, ok(undefined))).toBe(
      "/admin/inquiries?notice=deleted",
    );
    expect(deleteRedirect(id, err({ type: "NotFound", id }))).toBe(
      "/admin/inquiries?notice=notFound",
    );
    expect(
      deleteRedirect(id, err({ type: "StorageFailed", cause: null })),
    ).toBe(`/admin/inquiries/${id}?notice=unavailable`);
  });
});

describe("messagePreview", () => {
  it("줄바꿈과 연속 공백은 한 칸", () => {
    expect(messagePreview(" 가족사진\n\n촬영   문의 ")).toBe(
      "가족사진 촬영 문의",
    );
  });

  it("길면 코드 포인트 기준으로 자르고 말줄임 (이모지를 반으로 자르지 않는다)", () => {
    expect(messagePreview("😀".repeat(10), 3)).toBe("😀😀😀…");
    expect(messagePreview("가나다 라마", 4)).toBe("가나다…");
    expect(messagePreview("가나다", 3)).toBe("가나다");
  });
});

describe("toAdminInquiryRow / toAdminInquiryDetailView", () => {
  it("목록 한 줄: 이름(이름 성), 이메일, 받은 시각, 상태, 메시지 앞부분", () => {
    expect(toAdminInquiryRow(inquiry({ type: "New" }))).toEqual({
      id,
      name: "하늘 김",
      email: "sky@example.com",
      receivedAt,
      status: "New",
      preview: "가족사진 촬영 문의드립니다.",
    });
  });

  it("상세: 전체 메시지(줄바꿈 그대로), 상태 바뀐 시각, 허용 동작", () => {
    expect(
      toAdminInquiryDetailView(inquiry({ type: "Done", changedAt }), [
        "reopen",
      ]),
    ).toMatchObject({
      message: "가족사진\n\n촬영 문의드립니다.",
      status: "Done",
      changedAt,
      actions: ["reopen"],
    });
    expect(
      toAdminInquiryDetailView(inquiry({ type: "New" }), ["markRead"])
        .changedAt,
    ).toBeNull();
  });
});

describe("replyMailto", () => {
  it("받는 사람과 인코딩한 제목", () => {
    expect(replyMailto("sky@example.com", "[Machum Studio] 문의 답변")).toBe(
      "mailto:sky@example.com?subject=%5BMachum%20Studio%5D%20%EB%AC%B8%EC%9D%98%20%EB%8B%B5%EB%B3%80",
    );
  });

  it("주소 안의 ?, &, #, % 는 인코딩해 제목과 섞이지 않는다", () => {
    expect(replyMailto("a?b&c#d%e@example.com", "s")).toBe(
      "mailto:a%3Fb%26c%23d%25e@example.com?subject=s",
    );
  });
});
