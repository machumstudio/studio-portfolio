import { describe, expect, it } from "vitest";
import { err } from "@/shared/result";
import { parseInquiryForm } from "./schema";

const form = (entries: Record<string, string | Blob>) => {
  const data = new FormData();
  for (const [name, value] of Object.entries(entries)) data.append(name, value);
  return data;
};

describe("parseInquiryForm", () => {
  it("칸 값을 그대로 꺼낸다 (필수, 길이, 형식은 보지 않는다)", () => {
    expect(
      parseInquiryForm(
        form({
          firstName: "하늘",
          lastName: "",
          email: "not-an-email",
          phone: "12",
          message: "x".repeat(5000),
        }),
      ),
    ).toEqual({
      ok: true,
      value: {
        values: {
          firstName: "하늘",
          lastName: "",
          email: "not-an-email",
          phone: "12",
          message: "x".repeat(5000),
        },
        isBot: false,
      },
    });
  });

  it("빠진 칸은 빈 값이고, 모르는 칸은 버린다", () => {
    const parsed = parseInquiryForm(form({ firstName: "하늘", role: "admin" }));
    expect(parsed.ok && parsed.value.values).toEqual({
      firstName: "하늘",
      lastName: "",
      email: "",
      phone: "",
      message: "",
    });
  });

  it("줄바꿈 CRLF/CR 은 LF 로 바꾼다", () => {
    const parsed = parseInquiryForm(
      form({ message: "첫 줄\r\n둘째 줄\r셋째" }),
    );
    expect(parsed.ok && parsed.value.values.message).toBe(
      "첫 줄\n둘째 줄\n셋째",
    );
  });

  it("자모로 나뉜 한글(NFD)은 NFC 로 합친다", () => {
    const nfd = "하늘".normalize("NFD");
    expect(Array.from(nfd)).toHaveLength(5);
    const parsed = parseInquiryForm(form({ firstName: nfd }));
    expect(parsed.ok && parsed.value.values.firstName).toBe("하늘");
  });

  it("앞뒤 공백은 그대로 둔다 (지우는 것은 domain)", () => {
    const parsed = parseInquiryForm(form({ email: "  sky@example.com " }));
    expect(parsed.ok && parsed.value.values.email).toBe("  sky@example.com ");
  });

  it("허니팟 칸이 채워져 있으면 isBot", () => {
    const filled = parseInquiryForm(form({ website: "https://spam.test" }));
    expect(filled.ok && filled.value.isBot).toBe(true);
    const blank = parseInquiryForm(form({ website: " " }));
    expect(blank.ok && blank.value.isBot).toBe(false);
  });

  it("칸에 파일이 오면 MalformedForm", () => {
    expect(
      parseInquiryForm(form({ message: new Blob(["x"]), firstName: "하늘" })),
    ).toEqual(err({ type: "MalformedForm" }));
  });
});
