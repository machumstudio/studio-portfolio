import {
  restoreInquiry,
  type Inquiry,
  type InquiryError,
  type InquiryId,
} from "@/domain/inquiry/inquiry";
import type { InquiryStatus } from "@/domain/inquiry/status";
import { assertNever } from "@/shared/assert-never";
import { err, flatMap, ok, type Result } from "@/shared/result";
import type { InquiryRow } from "../supabase/database";

// inquiries 행과 Inquiry 사이의 모양 변환. 칸 검증은 restoreInquiry 가 한다 (docs/adr/0010)

export type InquiryRowError =
  | InquiryError
  | { type: "InvalidStoredStatus"; status: string; hasChangedAt: boolean };

// status + status_changed_at 두 칼럼 → 판별 유니온 (docs/adr/0008). DB 제약이 막는 조합이지만 여기서도 거른다
const toStatus = (
  status: string,
  changedAt: string | null,
): Result<InquiryStatus, InquiryRowError> => {
  if (status === "new" && changedAt === null) return ok({ type: "New" });
  if (status === "read" && changedAt !== null)
    return ok({ type: "Read", changedAt: new Date(changedAt) });
  if (status === "done" && changedAt !== null)
    return ok({ type: "Done", changedAt: new Date(changedAt) });
  return err({
    type: "InvalidStoredStatus",
    status,
    hasChangedAt: changedAt !== null,
  });
};

export const toInquiry = (row: InquiryRow): Result<Inquiry, InquiryRowError> =>
  flatMap(toStatus(row.status, row.status_changed_at), (status) =>
    restoreInquiry(
      {
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        phone: row.phone ?? undefined,
        message: row.message,
      },
      {
        id: row.id as InquiryId,
        receivedAt: new Date(row.received_at),
        status,
      },
    ),
  );

const statusColumns = (
  status: InquiryStatus,
): Pick<InquiryRow, "status" | "status_changed_at"> => {
  switch (status.type) {
    case "New":
      return { status: "new", status_changed_at: null };
    case "Read":
      return {
        status: "read",
        status_changed_at: status.changedAt.toISOString(),
      };
    case "Done":
      return {
        status: "done",
        status_changed_at: status.changedAt.toISOString(),
      };
    default:
      return assertNever(status);
  }
};

export const toInquiryRow = (inquiry: Inquiry): InquiryRow => ({
  id: inquiry.id,
  first_name: inquiry.firstName,
  last_name: inquiry.lastName,
  email: inquiry.email,
  phone: inquiry.phone,
  message: inquiry.message,
  received_at: inquiry.receivedAt.toISOString(),
  ...statusColumns(inquiry.status),
});
