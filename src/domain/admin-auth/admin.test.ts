import { describe, expect, it } from "vitest";
import { authorizeAdmin, type AuthenticatedUser } from "./admin";

const user = (role: unknown): AuthenticatedUser => ({
  id: "user-1",
  email: "admin@example.com",
  role,
});

describe("authorizeAdmin", () => {
  it("역할이 admin 이면 관리자", () => {
    expect(authorizeAdmin(user("admin"))).toEqual({
      ok: true,
      value: { id: "user-1", email: "admin@example.com" },
    });
  });

  it.each([
    ["역할 없음", undefined],
    ["null", null],
    ["빈 문자열", ""],
    ["다른 역할", "editor"],
    ["대문자", "Admin"],
    ["앞뒤 공백", " admin "],
    ["배열", ["admin"]],
    ["객체", { role: "admin" }],
    ["true", true],
  ])("%s 이면 거부", (_, role) => {
    expect(authorizeAdmin(user(role))).toEqual({
      ok: false,
      error: { type: "NotAdmin" },
    });
  });

  it("id 가 비어 있으면 역할이 admin 이어도 거부", () => {
    expect(authorizeAdmin({ ...user("admin"), id: "" }).ok).toBe(false);
  });
});
