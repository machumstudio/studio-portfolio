import type { InquiryStatusCounts } from "@/application/inquiry/admin-inquiry-repository";
import type {
  DeleteInquiryError,
  InquiryList,
} from "@/application/inquiry/admin-inquiries";
import type { ChangeInquiryStatusError } from "@/application/inquiry/change-inquiry-status";
import type { Inquiry } from "@/domain/inquiry/inquiry";
import type { InquiryAction, InquiryStatusType } from "@/domain/inquiry/status";
import { assertNever } from "@/shared/assert-never";
import type { Result } from "@/shared/result";

// 관리자 문의 화면의 모양과 주소 규칙 (19칸). 페이지, 서버 액션, 화면 컴포넌트가 같이 쓴다.
// 상태 변경과 지우기는 폼 POST → 서버 액션 → redirect(결과는 주소의 notice) 라서 JS 가 없어도 결과가 보인다 (docs/adr/0016)

export const adminInquiriesPath = "/admin/inquiries";

/** 주소에 쓰는 상태 이름 (?status=new) */
export const inquiryStatusParam = {
  New: "new",
  Read: "read",
  Done: "done",
} as const satisfies Record<InquiryStatusType, string>;

const statusByParam = new Map(
  Object.entries(inquiryStatusParam).map(([type, param]) => [
    param as string,
    type as InquiryStatusType,
  ]),
);

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export type InquiryListParams = {
  status: InquiryStatusType | null;
  page: number;
};

/** 목록 주소의 ?status=&page=. 모르는 값은 전체, 1페이지 (범위 보정은 listInquiries) */
export function parseInquiryListParams(searchParams: {
  status?: string | string[];
  page?: string | string[];
}): InquiryListParams {
  const status = statusByParam.get(first(searchParams.status) ?? "") ?? null;
  const raw = first(searchParams.page) ?? "";
  const page = /^\d{1,6}$/.test(raw) ? Number(raw) : 1;
  return { status, page };
}

export function inquiryListHref({
  status,
  page = 1,
  notice,
}: {
  status: InquiryStatusType | null;
  page?: number;
  notice?: ListNotice;
}): string {
  const query = new URLSearchParams();
  if (status) query.set("status", inquiryStatusParam[status]);
  if (page > 1) query.set("page", String(page));
  if (notice) query.set("notice", notice);
  const search = query.toString();
  return search ? `${adminInquiriesPath}?${search}` : adminInquiriesPath;
}

export const inquiryDetailHref = (id: string, notice?: DetailNotice) =>
  `${adminInquiriesPath}/${encodeURIComponent(id)}${notice ? `?notice=${notice}` : ""}`;

// 결과 알림. 메시지 키는 AdminInquiries.notices.<code>
/** 상세 화면: 바꾼 동작, 다른 탭과 부딪힘, 일시 오류, 화면이 보낸 값이 아님 */
export type DetailNotice =
  InquiryAction | "conflict" | "unavailable" | "malformed";
/** 목록 화면: 지움, 찾을 수 없음(다른 탭에서 지움) */
export type ListNotice = "deleted" | "notFound";

const detailNotices: readonly DetailNotice[] = [
  "markRead",
  "markDone",
  "reopen",
  "conflict",
  "unavailable",
  "malformed",
];
const listNotices: readonly ListNotice[] = ["deleted", "notFound"];

const parseNotice = <T extends string>(
  allowed: readonly T[],
  value: string | string[] | undefined,
): T | undefined => allowed.find((notice) => notice === first(value));

export const parseDetailNotice = (value: string | string[] | undefined) =>
  parseNotice(detailNotices, value);
export const parseListNotice = (value: string | string[] | undefined) =>
  parseNotice(listNotices, value);

/** 상태 바꾸기 결과 → 돌아갈 주소. 문의가 없어졌으면 목록으로 */
export function statusChangeRedirect(
  id: string,
  action: InquiryAction,
  result: Result<unknown, ChangeInquiryStatusError>,
): string {
  if (result.ok) return inquiryDetailHref(id, action);
  switch (result.error.type) {
    // 다른 탭이나 기기에서 먼저 바꿨다. 다시 그린 화면이 지금 상태와 그때 할 수 있는 버튼을 보여 준다
    case "InvalidTransition":
      return inquiryDetailHref(id, "conflict");
    case "NotFound":
      return inquiryListHref({ status: null, notice: "notFound" });
    case "StorageFailed":
      return inquiryDetailHref(id, "unavailable");
    default:
      return assertNever(result.error);
  }
}

/** 지우기 결과 → 돌아갈 주소 */
export function deleteRedirect(
  id: string,
  result: Result<unknown, DeleteInquiryError>,
): string {
  if (result.ok) return inquiryListHref({ status: null, notice: "deleted" });
  switch (result.error.type) {
    case "NotFound":
      return inquiryListHref({ status: null, notice: "notFound" });
    case "StorageFailed":
      return inquiryDetailHref(id, "unavailable");
    default:
      return assertNever(result.error);
  }
}

/** 목록 한 줄. 메시지는 앞부분만 보낸다 (전체는 상세에서) */
export type AdminInquiryRow = {
  id: string;
  name: string;
  email: string;
  receivedAt: Date;
  status: InquiryStatusType;
  preview: string;
};

export type AdminInquiryListView = {
  items: readonly AdminInquiryRow[];
  counts: InquiryStatusCounts;
  total: number;
  status: InquiryStatusType | null;
  page: number;
  pageCount: number;
};

export type AdminInquiryDetailView = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  receivedAt: Date;
  status: InquiryStatusType;
  /** Read/Done 이 된 시각 (docs/adr/0008). New 면 null */
  changedAt: Date | null;
  /** 지금 상태에서 누를 수 있는 동작 (전이 규칙에서 뽑는다) */
  actions: readonly InquiryAction[];
};

/** 알림 메일과 같은 순서 (이름 성) */
export const inquiryName = (inquiry: Inquiry) =>
  `${inquiry.firstName} ${inquiry.lastName}`;

export const previewLength = 80;

/** 줄바꿈과 연속 공백을 한 칸으로, 코드 포인트 기준으로 잘라 말줄임 (이모지를 반으로 자르지 않는다) */
export function messagePreview(message: string, max = previewLength): string {
  const oneLine = message.replace(/\s+/g, " ").trim();
  const chars = Array.from(oneLine);
  return chars.length > max
    ? `${chars.slice(0, max).join("").trimEnd()}…`
    : oneLine;
}

export const toAdminInquiryRow = (inquiry: Inquiry): AdminInquiryRow => ({
  id: inquiry.id,
  name: inquiryName(inquiry),
  email: inquiry.email,
  receivedAt: inquiry.receivedAt,
  status: inquiry.status.type,
  preview: messagePreview(inquiry.message),
});

export const toAdminInquiryListView = (
  list: InquiryList,
): AdminInquiryListView => ({
  items: list.items.map(toAdminInquiryRow),
  counts: list.counts,
  total: list.total,
  status: list.status,
  page: list.page,
  pageCount: list.pageCount,
});

export const toAdminInquiryDetailView = (
  inquiry: Inquiry,
  actions: readonly InquiryAction[],
): AdminInquiryDetailView => ({
  id: inquiry.id,
  name: inquiryName(inquiry),
  email: inquiry.email,
  phone: inquiry.phone,
  message: inquiry.message,
  receivedAt: inquiry.receivedAt,
  status: inquiry.status.type,
  changedAt: inquiry.status.type === "New" ? null : inquiry.status.changedAt,
  actions,
});

/**
 * 답장 메일 주소: 받는 사람과 제목을 채운다. domain 은 공백과 @ 만 막으므로
 * 주소 안의 ?, #, &, % 와 ASCII 밖 글자는 퍼센트 인코딩해 제목 칸과 섞이지 않게 한다 (RFC 6068)
 */
export const replyMailto = (email: string, subject: string) =>
  `mailto:${encodeURI(email).replace(/[?#&]/g, encodeURIComponent)}?subject=${encodeURIComponent(subject)}`;
