import { z } from "zod";
import type { InquiryInput } from "@/domain/inquiry/inquiry";
import { err, ok, type Result } from "@/shared/result";

// 문의 폼 칸 이름. FormData 의 name, 칸별 오류의 키, 화면 순서(첫 오류 칸 찾기)가 모두 이것을 쓴다
export const inquiryFieldNames = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "message",
] as const satisfies readonly (keyof InquiryInput)[];
export type InquiryFieldName = (typeof inquiryFieldNames)[number];
export type InquiryFormValues = Record<InquiryFieldName, string>;

/** 사람에게는 보이지 않는 칸. 채워져 오면 자동 제출로 본다 */
export const honeypotFieldName = "website";

// 여기서는 FormData 의 형태(칸이 문자열인지, 빠진 칸은 빈 값)와 문자열 정리만 한다.
// 필수, 길이, 형식은 domain(createInquiry) 한 곳에서만 본다 (docs/adr/0009).
// 정리: 유니코드 NFC (macOS 에서 붙여 넣은 한글이 자모로 나뉘어 글자 수가 늘지 않게),
// 줄바꿈 CRLF/CR → LF (브라우저가 textarea 줄바꿈을 CRLF 로 보내 한도를 두 배로 세지 않게)
const text = z
  .string()
  .default("")
  .transform((value) => value.normalize("NFC").replace(/\r\n?/g, "\n"));

export const inquiryFormSchema = z.object({
  firstName: text,
  lastName: text,
  email: text,
  phone: text,
  message: text,
  [honeypotFieldName]: text,
});

export type ParsedInquiryForm = {
  values: InquiryFormValues;
  /** 허니팟 칸이 채워졌으면 true */
  isBot: boolean;
};

/** 칸에 파일이 오는 것처럼 폼으로 만들 수 없는 요청 */
export type MalformedInquiryForm = { type: "MalformedForm" };

export function parseInquiryForm(
  formData: FormData,
): Result<ParsedInquiryForm, MalformedInquiryForm> {
  const raw = Object.fromEntries(
    [...inquiryFieldNames, honeypotFieldName].map((name) => [
      name,
      formData.get(name) ?? undefined,
    ]),
  );
  const parsed = inquiryFormSchema.safeParse(raw);
  if (!parsed.success) return err({ type: "MalformedForm" });
  const { [honeypotFieldName]: honeypot, ...values } = parsed.data;
  return ok({ values, isBot: honeypot.trim() !== "" });
}
