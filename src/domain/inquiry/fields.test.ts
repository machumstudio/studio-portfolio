import { describe, expect, it } from "vitest";
import { err, ok } from "@/shared/result";
import {
  inquiryLimits,
  parseEmail,
  parseInquiryMessage,
  parseOptionalPhone,
  parsePersonName,
} from "./fields";

const repeat = (char: string, count: number) => char.repeat(count);

describe("parsePersonName", () => {
  it("앞뒤 공백을 지운다", () => {
    expect(parsePersonName("  하늘 ")).toEqual(ok("하늘"));
  });

  it.each(["", "   ", "\n\t"])("빈 값 %j 는 Required", (value) => {
    expect(parsePersonName(value)).toEqual(err({ type: "Required" }));
  });

  it("50자까지 되고 51자는 TooLong", () => {
    expect(parsePersonName(repeat("가", 50)).ok).toBe(true);
    expect(parsePersonName(repeat("가", 51))).toEqual(
      err({ type: "TooLong", max: inquiryLimits.name }),
    );
  });

  it("길이는 앞뒤 공백을 지운 뒤 코드 포인트로 센다 (이모지 1개 = 1자)", () => {
    expect(parsePersonName(` ${repeat("a", 50)} `).ok).toBe(true);
    expect(parsePersonName(repeat("😀", 50)).ok).toBe(true);
    expect(parsePersonName(repeat("😀", 51)).ok).toBe(false);
  });
});

describe("parseInquiryMessage", () => {
  it("앞뒤 공백만 지우고 안쪽 줄바꿈은 둔다", () => {
    expect(parseInquiryMessage("\n 안녕하세요\n\n촬영 문의 \n")).toEqual(
      ok("안녕하세요\n\n촬영 문의"),
    );
  });

  it("빈 값은 Required", () => {
    expect(parseInquiryMessage(" \n ")).toEqual(err({ type: "Required" }));
  });

  it("2000자까지 되고 2001자는 TooLong", () => {
    expect(parseInquiryMessage(repeat("가", 2000)).ok).toBe(true);
    expect(parseInquiryMessage(repeat("가", 2001))).toEqual(
      err({ type: "TooLong", max: inquiryLimits.message }),
    );
  });
});

describe("parseEmail", () => {
  it.each([
    ["hello@machum.studio", "hello@machum.studio"],
    ["  Hello.Kim+photo@Machum.Studio ", "Hello.Kim+photo@machum.studio"],
    ["a@b.co.kr", "a@b.co.kr"],
  ])("%j 는 %j (도메인만 소문자)", (value, expected) => {
    expect(parseEmail(value)).toEqual(ok(expected));
  });

  it("빈 값은 Required", () => {
    expect(parseEmail("  ")).toEqual(err({ type: "Required" }));
  });

  it.each([
    "machum.studio",
    "@machum.studio",
    "hello@",
    "hello@machum",
    "hello@@machum.studio",
    "hel lo@machum.studio",
    "hello@machum..studio",
    "hello@.machum.studio",
    "hello@machum.studio.",
  ])("%j 는 InvalidEmail", (value) => {
    expect(parseEmail(value)).toEqual(err({ type: "InvalidEmail" }));
  });

  it("@ 앞부분은 64자까지", () => {
    expect(parseEmail(`${repeat("a", 64)}@machum.studio`).ok).toBe(true);
    expect(parseEmail(`${repeat("a", 65)}@machum.studio`)).toEqual(
      err({ type: "InvalidEmail" }),
    );
  });

  it("전체는 254자까지 되고 255자는 TooLong", () => {
    // 64 + "@" + 189 = 254
    const domain = (size: number) => `${repeat("d", size - 4)}.com`;
    expect(parseEmail(`${repeat("a", 64)}@${domain(189)}`).ok).toBe(true);
    expect(parseEmail(`${repeat("a", 64)}@${domain(190)}`)).toEqual(
      err({ type: "TooLong", max: inquiryLimits.email }),
    );
  });
});

describe("parseOptionalPhone", () => {
  it.each(["", "   "])("빈 값 %j 는 입력 안 함(null)", (value) => {
    expect(parseOptionalPhone(value)).toEqual(ok(null));
  });

  it.each([
    "010-1234-5678",
    "01012345678",
    "02 123 4567",
    "(02) 123-4567",
    "+82 10-1234-5678",
    "1588-0000",
    "+1 (555) 123-4567",
  ])("%j 는 입력한 모양 그대로", (value) => {
    expect(parseOptionalPhone(` ${value} `)).toEqual(ok(value));
  });

  it("숫자는 8자리부터 15자리까지", () => {
    expect(parseOptionalPhone("1234567").ok).toBe(false);
    expect(parseOptionalPhone("12345678").ok).toBe(true);
    expect(parseOptionalPhone("123456789012345").ok).toBe(true);
    expect(parseOptionalPhone("1234567890123456").ok).toBe(false);
  });

  it("구분자를 포함해 20자까지", () => {
    expect(parseOptionalPhone("+82 (10) 1234 - 5678").ok).toBe(true);
    expect(parseOptionalPhone("+82 (10)  1234 - 5678")).toEqual(
      err({ type: "InvalidPhone" }),
    );
  });

  it.each(["010-1234-567a", "010.1234.5678", "82+10-1234-5678", "전화 주세요"])(
    "허용하지 않는 글자가 있으면 InvalidPhone: %j",
    (value) => {
      expect(parseOptionalPhone(value)).toEqual(err({ type: "InvalidPhone" }));
    },
  );
});
