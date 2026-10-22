import { describe, expect, expectTypeOf, it } from "vitest";
import { err, flatMap, map, match, ok, type Result } from "./result";

const parsePositive = (n: number): Result<number, "NotPositive"> =>
  n > 0 ? ok(n) : err("NotPositive");

describe("Result", () => {
  it("map 은 ok 값만 바꾸고 err 는 그대로 둔다", () => {
    expect(map(ok(2), (n) => n * 10)).toEqual(ok(20));
    expect(map(err("E") as Result<number, string>, (n) => n * 10)).toEqual(
      err("E"),
    );
  });

  it("flatMap 은 ok 일 때만 다음 단계를 실행하고 에러 타입을 합친다", () => {
    expect(flatMap(ok(3), parsePositive)).toEqual(ok(3));
    expect(flatMap(ok(-1), parsePositive)).toEqual(err("NotPositive"));

    const first = err("Empty") as Result<number, "Empty">;
    const chained = flatMap(first, parsePositive);
    expect(chained).toEqual(err("Empty"));
    expectTypeOf(chained).toEqualTypeOf<
      Result<number, "Empty" | "NotPositive">
    >();
  });

  it("match 는 경우에 맞는 핸들러 결과를 돌려준다", () => {
    const show = (r: Result<number, string>) =>
      match(r, { ok: (n) => `ok:${n}`, err: (e) => `err:${e}` });
    expect(show(ok(1))).toBe("ok:1");
    expect(show(err("x"))).toBe("err:x");
  });
});
