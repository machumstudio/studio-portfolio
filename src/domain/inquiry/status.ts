import { assertNever } from "@/shared/assert-never";
import { err, ok, type Result } from "@/shared/result";

// 문의 처리 상태. New(접수) → Read(확인) → Done(완료), 되돌리기는 Done → Read 만.
// Read/Done 은 그 상태가 된 시각을 갖는다 (New 의 시각은 Inquiry.receivedAt). 이유는 docs/adr/0008
export type InquiryStatus =
  | { readonly type: "New" }
  | { readonly type: "Read"; readonly changedAt: Date }
  | { readonly type: "Done"; readonly changedAt: Date };

export type InquiryStatusType = InquiryStatus["type"];

// 관리자가 하는 동작. 목표 상태가 아니라 동작으로 받아서 "같은 상태로 다시"를 거를 수 있다
export const inquiryActions = ["markRead", "markDone", "reopen"] as const;
export type InquiryAction = (typeof inquiryActions)[number];

export type InvalidTransition = {
  type: "InvalidTransition";
  from: InquiryStatusType;
  action: InquiryAction;
};

// 허용: New --markRead--> Read --markDone--> Done --reopen--> Read. 나머지는 모두 InvalidTransition
export function transitionStatus(
  status: InquiryStatus,
  action: InquiryAction,
  at: Date,
): Result<InquiryStatus, InvalidTransition> {
  const reject = () =>
    err<InvalidTransition>({
      type: "InvalidTransition",
      from: status.type,
      action,
    });

  switch (status.type) {
    case "New":
      return action === "markRead"
        ? ok({ type: "Read", changedAt: at })
        : reject();
    case "Read":
      return action === "markDone"
        ? ok({ type: "Done", changedAt: at })
        : reject();
    case "Done":
      return action === "reopen"
        ? ok({ type: "Read", changedAt: at })
        : reject();
    default:
      return assertNever(status);
  }
}
