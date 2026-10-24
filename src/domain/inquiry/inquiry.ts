import type { Brand } from "@/shared/brand";
import { err, map, ok, type Result } from "@/shared/result";
import {
  parseEmail,
  parseInquiryMessage,
  parseOptionalPhone,
  parsePersonName,
  type Email,
  type EmailError,
  type InquiryMessage,
  type PersonName,
  type Phone,
  type PhoneError,
  type RequiredTextError,
} from "./fields";
import {
  transitionStatus,
  type InquiryAction,
  type InquiryStatus,
  type InvalidTransition,
} from "./status";

export type InquiryId = Brand<string, "InquiryId">;
export type InvalidInquiryId = { type: "InvalidInquiryId"; value: string };

// 관리자 주소(/admin/inquiries/[id]) 처럼 바깥에서 들어온 ID. 빈 값만 거른다 (형식은 저장소가 정한다)
export const parseInquiryId = (
  value: string,
): Result<InquiryId, InvalidInquiryId> =>
  value.trim()
    ? ok(value.trim() as InquiryId)
    : err({ type: "InvalidInquiryId", value });

export type Inquiry = {
  readonly id: InquiryId;
  readonly firstName: PersonName;
  readonly lastName: PersonName;
  readonly email: Email;
  /** 선택 항목. 입력하지 않으면 null */
  readonly phone: Phone | null;
  readonly message: InquiryMessage;
  readonly receivedAt: Date;
  readonly status: InquiryStatus;
};

/** 폼에서 온 그대로의 값. phone 은 비우거나 빼도 된다 */
export type InquiryInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message: string;
};

export type InquiryFieldErrors = {
  firstName?: RequiredTextError;
  lastName?: RequiredTextError;
  email?: EmailError;
  phone?: PhoneError;
  message?: RequiredTextError;
};

// 폼 칸마다 에러를 하나씩 모아 돌려준다. JS 없이 제출해 서버 검증만 거친 경우에도
// 화면이 틀린 칸을 한 번에 모두 표시할 수 있게 한다 (13칸 submitInquiryAction 이 칸별로 매핑)
export type InquiryError = {
  type: "InvalidInquiry";
  fields: InquiryFieldErrors;
};

// 새 문의는 이 함수로만 만든다. 새 문의는 항상 New (저장된 문의는 restoreInquiry)
export function createInquiry(
  input: InquiryInput,
  { id, receivedAt }: { id: InquiryId; receivedAt: Date },
): Result<Inquiry, InquiryError> {
  const firstName = parsePersonName(input.firstName);
  const lastName = parsePersonName(input.lastName);
  const email = parseEmail(input.email);
  const phone = parseOptionalPhone(input.phone ?? "");
  const message = parseInquiryMessage(input.message);

  if (!firstName.ok || !lastName.ok || !email.ok || !phone.ok || !message.ok) {
    const fields: InquiryFieldErrors = {
      ...(!firstName.ok && { firstName: firstName.error }),
      ...(!lastName.ok && { lastName: lastName.error }),
      ...(!email.ok && { email: email.error }),
      ...(!phone.ok && { phone: phone.error }),
      ...(!message.ok && { message: message.error }),
    };
    return err({ type: "InvalidInquiry", fields });
  }

  return ok({
    id,
    firstName: firstName.value,
    lastName: lastName.value,
    email: email.value,
    phone: phone.value,
    message: message.value,
    receivedAt,
    status: { type: "New" },
  });
}

// 저장소에서 읽은 문의를 되살린다. 칸 검증은 새 문의와 같고, 상태만 저장된 그대로 둔다.
// 저장소가 상태를 바꿔 끼우려고 createInquiry 결과를 펼쳐 덮지 않게 이 함수로만 복원한다 (docs/adr/0010)
export const restoreInquiry = (
  input: InquiryInput,
  {
    id,
    receivedAt,
    status,
  }: { id: InquiryId; receivedAt: Date; status: InquiryStatus },
): Result<Inquiry, InquiryError> =>
  map(createInquiry(input, { id, receivedAt }), (inquiry) => ({
    ...inquiry,
    status,
  }));

export const transitionInquiry = (
  inquiry: Inquiry,
  action: InquiryAction,
  at: Date,
): Result<Inquiry, InvalidTransition> =>
  map(transitionStatus(inquiry.status, action, at), (status) => ({
    ...inquiry,
    status,
  }));
