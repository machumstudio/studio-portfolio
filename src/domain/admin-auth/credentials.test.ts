import { describe, expect, it } from "vitest";
import { credentialLimits, parseCredentials } from "./credentials";

describe("parseCredentials", () => {
  it("이메일 앞뒤 공백은 빼고 비밀번호는 그대로", () => {
    expect(
      parseCredentials({ email: "  admin@example.com ", password: " pw " }),
    ).toEqual({
      ok: true,
      value: { email: "admin@example.com", password: " pw " },
    });
  });

  it.each([
    ["이메일 빈 값", { email: "", password: "pw" }],
    ["이메일 공백만", { email: "   ", password: "pw" }],
    ["비밀번호 빈 값", { email: "a@example.com", password: "" }],
    ["비밀번호 공백만", { email: "a@example.com", password: "   " }],
  ])("%s → MissingCredentials", (_, input) => {
    expect(parseCredentials(input)).toEqual({
      ok: false,
      error: { type: "MissingCredentials" },
    });
  });

  it("한도를 넘으면 MalformedCredentials (한도까지는 통과)", () => {
    const email = (n: number) => `${"a".repeat(n - 12)}@example.com`;
    const password = (n: number) => "가".repeat(n);
    expect(
      parseCredentials({
        email: email(credentialLimits.email),
        password: password(credentialLimits.password),
      }).ok,
    ).toBe(true);
    for (const input of [
      { email: email(credentialLimits.email + 1), password: "pw" },
      {
        email: "a@example.com",
        password: password(credentialLimits.password + 1),
      },
    ])
      expect(parseCredentials(input)).toEqual({
        ok: false,
        error: { type: "MalformedCredentials" },
      });
  });
});
