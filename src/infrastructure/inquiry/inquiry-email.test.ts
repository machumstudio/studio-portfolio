import { describe, expect, it } from "vitest";
import { createInquiry, type InquiryId } from "@/domain/inquiry/inquiry";
import { buildInquiryEmail, escapeHtml, formatKst } from "./inquiry-email";

const make = (overrides: Partial<Parameters<typeof createInquiry>[0]> = {}) => {
  const created = createInquiry(
    {
      firstName: "하늘",
      lastName: "김",
      email: "sky@example.com",
      phone: "010-0000-0000",
      message: "가족사진 촬영 문의드립니다.\n주말 가능할까요?",
      ...overrides,
    },
    {
      id: "inq-1" as InquiryId,
      receivedAt: new Date("2026-10-24T15:30:00Z"),
    },
  );
  if (!created.ok) throw new Error(created.error.type);
  return created.value;
};

describe("formatKst", () => {
  it("UTC 를 한국 시간으로 바꾸고 날짜가 넘어가면 다음 날로 적는다", () => {
    expect(formatKst(new Date("2026-10-24T15:30:00Z"))).toBe(
      "2026-10-25 00:30 (KST)",
    );
  });
});

describe("escapeHtml", () => {
  it("HTML 특수 문자 다섯 개를 바꾼다", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;",
    );
  });
});

describe("buildInquiryEmail", () => {
  it("제목에 이름, 본문에 이름/이메일/연락처/접수 시각/문의 ID/메시지", () => {
    const { subject, html, text } = buildInquiryEmail(make());
    expect(subject).toBe("[Machum Studio] 새 문의: 하늘 김");
    for (const body of [html, text])
      for (const value of [
        "하늘 김",
        "sky@example.com",
        "010-0000-0000",
        "2026-10-25 00:30 (KST)",
        "inq-1",
        "가족사진 촬영 문의드립니다.",
      ])
        expect(body).toContain(value);
    expect(text).toContain(
      "메시지:\n가족사진 촬영 문의드립니다.\n주말 가능할까요?",
    );
  });

  it("연락처가 없으면 입력 안 함으로 적는다", () => {
    expect(buildInquiryEmail(make({ phone: "" })).text).toContain(
      "연락처: (입력 안 함)",
    );
  });

  it("사용자 입력은 HTML 에서 이스케이프하고, 텍스트 버전은 그대로 둔다", () => {
    const { html, text } = buildInquiryEmail(
      make({
        firstName: "<b>하늘</b>",
        message: `<script>alert("x")</script> & <img src=x onerror=1>`,
      }),
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<b>하늘");
    expect(html).toContain(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &lt;img src=x onerror=1&gt;",
    );
    expect(text).toContain(`<script>alert("x")</script>`);
  });

  it("이름의 줄바꿈은 제목에서 공백 하나로 바꾼다", () => {
    expect(buildInquiryEmail(make({ firstName: "하\n\r늘" })).subject).toBe(
      "[Machum Studio] 새 문의: 하 늘 김",
    );
  });
});
