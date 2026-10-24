import { describe, expect, it } from "vitest";
import { findLeaks } from "./check-client-bundle.mjs";

const env = { SUPABASE_SECRET_KEY: "sb_secret_abc123", SUPABASE_DB_URL: "" };
const file = (text, client = true) => ({ path: "chunk.js", text, client });

describe("findLeaks", () => {
  it("비밀이 없으면 통과한다 (publishable 키와 URL 은 공개 값)", () => {
    expect(
      findLeaks(
        [file('const k="sb_publishable_x";const u="NEXT_PUBLIC_SUPABASE_URL"')],
        env,
      ),
    ).toEqual([]);
  });

  it("secret 키 값이 있으면 변수 이름만 알리고 값은 출력하지 않는다", () => {
    const leaks = findLeaks([file('x="sb_secret_abc123"')], env);
    expect(leaks).toContain("chunk.js: SUPABASE_SECRET_KEY 의 값");
    expect(leaks.join("\n")).not.toContain("abc123");
  });

  it("값을 몰라도(CI) sb_secret_ 접두사는 잡는다", () => {
    expect(findLeaks([file('x="sb_secret_other"')], {})).toEqual([
      "chunk.js: secret 키 접두사 sb_secret_",
    ]);
  });

  it("클라이언트 번들의 서버 전용 변수 이름은 실패, 서버 HTML/RSC 에서는 이름을 보지 않는다", () => {
    expect(findLeaks([file("process.env.SUPABASE_SECRET_KEY")], {})).toEqual([
      "chunk.js: 서버 전용 변수 이름 SUPABASE_SECRET_KEY",
    ]);
    expect(findLeaks([file("SUPABASE_SECRET_KEY", false)], {})).toEqual([]);
  });

  it("빈 값은 검사하지 않는다 (빈 문자열은 모든 파일에 들어 있다)", () => {
    expect(findLeaks([file("anything")], { SUPABASE_DB_URL: " " })).toEqual([]);
  });
});
