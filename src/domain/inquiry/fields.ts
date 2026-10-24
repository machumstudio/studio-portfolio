import type { Brand } from "@/shared/brand";
import { err, ok, type Result } from "@/shared/result";

// 문의 폼 항목의 값 객체. 시안 Contact 폼(First Name, Last Name, Email, Phone Number, Your Message)과 1:1.
// 앞뒤 공백은 지우고, 길이는 코드 포인트 수로 센다 (이모지 1개 = 1자, 한글 1자 = 1자)
export type PersonName = Brand<string, "PersonName">;
export type Email = Brand<string, "Email">;
export type Phone = Brand<string, "Phone">;
export type InquiryMessage = Brand<string, "InquiryMessage">;

// 화면(13칸 zod 스키마)과 서버가 같은 한도를 쓴다
export const inquiryLimits = {
  /** 이름 칸 하나(First/Last 각각). 한국 이름은 5자 안팎, 긴 외국 이름 + 여유 */
  name: 50,
  /** RFC 5321: 주소 전체 254, @ 앞부분 64 */
  email: 254,
  emailLocalPart: 64,
  /** E.164 국가번호 포함 최대 15자리. 최소 8자리는 국내 대표번호(1588-0000) */
  phoneDigitsMin: 8,
  phoneDigitsMax: 15,
  /** 숫자 15자리 + 국가번호 기호와 구분자 여유 */
  phone: 20,
  /** A4 한 장 분량. 15칸 Slack 알림의 section 블록 한도(3000자) 안에 들어간다 */
  message: 2000,
} as const;

export type RequiredTextError =
  { type: "Required" } | { type: "TooLong"; max: number };
export type EmailError = RequiredTextError | { type: "InvalidEmail" };
export type PhoneError = { type: "InvalidPhone" };

const length = (value: string) => Array.from(value).length;

const parseRequiredText = (
  value: string,
  max: number,
): Result<string, RequiredTextError> => {
  const trimmed = value.trim();
  if (!trimmed) return err({ type: "Required" });
  if (length(trimmed) > max) return err({ type: "TooLong", max });
  return ok(trimmed);
};

export const parsePersonName = (
  value: string,
): Result<PersonName, RequiredTextError> =>
  parseRequiredText(value, inquiryLimits.name) as Result<
    PersonName,
    RequiredTextError
  >;

export const parseInquiryMessage = (
  value: string,
): Result<InquiryMessage, RequiredTextError> =>
  parseRequiredText(value, inquiryLimits.message) as Result<
    InquiryMessage,
    RequiredTextError
  >;

// 답장을 보낼 수 있는지만 본다: 공백 없는 앞부분 @ 점으로 나뉜 도메인.
// 실제 존재 여부는 메일을 보내 봐야 안다. 도메인은 대소문자 구분이 없어 소문자로 맞춘다
const emailPattern = /^([^\s@]+)@([^\s@.]+(?:\.[^\s@.]+)+)$/;

export const parseEmail = (value: string): Result<Email, EmailError> => {
  const trimmed = value.trim();
  if (!trimmed) return err({ type: "Required" });
  if (length(trimmed) > inquiryLimits.email)
    return err({ type: "TooLong", max: inquiryLimits.email });
  const match = emailPattern.exec(trimmed);
  if (!match || length(match[1]) > inquiryLimits.emailLocalPart)
    return err({ type: "InvalidEmail" });
  return ok(`${match[1]}@${match[2].toLowerCase()}` as Email);
};

// 숫자, 공백, 하이픈, 괄호, 맨 앞 + 만. 입력한 모양 그대로 둔다 (관리자가 보고 전화한다)
const phonePattern = /^\+?[\d\s()-]+$/;

/** 빈 값은 "입력 안 함"이라 null. 연락처는 선택 항목이다 */
export const parseOptionalPhone = (
  value: string,
): Result<Phone | null, PhoneError> => {
  const trimmed = value.trim();
  if (!trimmed) return ok(null);
  const digits = trimmed.replace(/\D/g, "").length;
  const valid =
    trimmed.length <= inquiryLimits.phone &&
    phonePattern.test(trimmed) &&
    digits >= inquiryLimits.phoneDigitsMin &&
    digits <= inquiryLimits.phoneDigitsMax;
  return valid ? ok(trimmed as Phone) : err({ type: "InvalidPhone" });
};
