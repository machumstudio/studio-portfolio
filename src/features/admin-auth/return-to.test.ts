import { describe, expect, it } from "vitest";
import { adminLoginUrl, safeAdminReturnPath } from "./return-to";

describe("safeAdminReturnPath", () => {
  it.each([
    ["/admin", "/admin"],
    ["/admin/works", "/admin/works"],
    ["/admin/works/new?draft=1#photos", "/admin/works/new?draft=1#photos"],
    ["/admin/inquiries?status=new", "/admin/inquiries?status=new"],
    // 정규화한 값을 돌려준다
    ["/admin/works/../inquiries", "/admin/inquiries"],
  ])("같은 사이트의 /admin 경로는 그대로: %s", (raw, expected) => {
    expect(safeAdminReturnPath(raw)).toBe(expected);
  });

  it.each([
    // 바깥 주소
    "https://evil.example",
    "https://evil.example/admin",
    "http:/evil.example/admin",
    "//evil.example",
    "//evil.example/admin",
    "///evil.example/admin",
    "/\\evil.example",
    "\\\\evil.example",
    "/%5Cevil.example",
    "javascript:alert(1)",
    "data:text/html,hi",
    // 브라우저가 지우는 제어 문자로 // 를 만드는 시도
    "/\t/evil.example",
    "/\n/evil.example",
    "/admin\r\n/x",
    // /admin 밖의 같은 사이트 경로
    "/",
    "/contact",
    "/en/admin",
    "/administrator",
    "/admin-evil",
    "/admin/../contact",
    "/admin/%2e%2e/contact",
    // 로그인 화면 자신
    "/admin/login",
    "/admin/login?next=/admin/works",
    // 문자열이 아니거나 빈 값
    "",
    "admin",
    undefined,
    null,
    ["/admin/works"],
  ])("그 밖은 /admin: %j", (raw) => {
    expect(safeAdminReturnPath(raw)).toBe("/admin");
  });

  it("%2F%2F 처럼 인코딩한 슬래시는 경로 안의 글자로 남는다 (출처가 바뀌지 않는다)", () => {
    expect(safeAdminReturnPath("/admin/%2F%2Fevil.example")).toBe(
      "/admin/%2F%2Fevil.example",
    );
  });
});

describe("adminLoginUrl", () => {
  it("기본 목적지(/admin)면 next 를 붙이지 않는다", () => {
    expect(adminLoginUrl("/admin")).toBe("/admin/login");
  });

  it("다른 /admin 경로는 인코딩해서 붙인다", () => {
    expect(adminLoginUrl("/admin/works?draft=1")).toBe(
      "/admin/login?next=%2Fadmin%2Fworks%3Fdraft%3D1",
    );
  });

  it("허용하지 않는 곳은 붙이지 않는다", () => {
    expect(adminLoginUrl("//evil.example")).toBe("/admin/login");
  });
});
