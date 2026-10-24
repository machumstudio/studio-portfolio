import type { Inquiry } from "@/domain/inquiry/inquiry";

export type InquiryEmail = { subject: string; html: string; text: string };

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

// 접수 시각을 한국 시간으로. 서버 TZ, ICU 버전과 상관없이 같은 모양이 나오게 직접 만든다 (KST 는 서머타임이 없다)
export function formatKst(date: Date): string {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())} ${pad(kst.getUTCHours())}:${pad(kst.getUTCMinutes())} (KST)`;
}

const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => htmlEntities[char]);

// 제목은 한 줄이어야 한다. 이름 칸은 검증에서 줄바꿈을 막지 않으므로 공백으로 바꾼다
const oneLine = (value: string) => value.replace(/\s+/g, " ").trim();

// 관리자에게 보내는 새 문의 메일 (한국어). 이름은 폼 순서(First, Last)대로 붙인다.
// 사용자 입력은 HTML 에서 모두 이스케이프하고, 메일 앱이 HTML 을 막아도 읽히게 텍스트 버전을 같이 만든다
export function buildInquiryEmail(inquiry: Inquiry): InquiryEmail {
  const name = oneLine(`${inquiry.firstName} ${inquiry.lastName}`);
  const rows: [label: string, value: string][] = [
    ["이름", name],
    ["이메일", inquiry.email],
    ["연락처", inquiry.phone ?? "(입력 안 함)"],
    ["접수 시각", formatKst(inquiry.receivedAt)],
    ["문의 ID", inquiry.id],
  ];

  const text = [
    "새 문의가 접수됐습니다. 이 메일에 답장하면 문의자에게 바로 갑니다.",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "메시지:",
    inquiry.message,
  ].join("\n");

  const cell = "padding:4px 12px 4px 0;vertical-align:top";
  const html = [
    "<!doctype html>",
    '<html lang="ko"><body style="font-family:sans-serif;line-height:1.6">',
    "<p>새 문의가 접수됐습니다. 이 메일에 답장하면 문의자에게 바로 갑니다.</p>",
    "<table>",
    ...rows.map(
      ([label, value]) =>
        `<tr><th align="left" style="${cell}">${label}</th><td style="${cell}">${escapeHtml(value)}</td></tr>`,
    ),
    "</table>",
    '<h2 style="font-size:16px">메시지</h2>',
    `<p style="white-space:pre-wrap">${escapeHtml(inquiry.message)}</p>`,
    "</body></html>",
  ].join("\n");

  return { subject: `[Machum Studio] 새 문의: ${name}`, html, text };
}
