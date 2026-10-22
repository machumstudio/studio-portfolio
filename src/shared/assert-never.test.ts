import { describe, expect, it } from "vitest";
import { assertNever } from "./assert-never";

type Status = { type: "New" } | { type: "Done" };

const label = (s: Status) => {
  switch (s.type) {
    case "New":
      return "신규";
    case "Done":
      return "완료";
    default:
      return assertNever(s);
  }
};

describe("assertNever", () => {
  it("모든 케이스를 다루면 정상 동작한다", () => {
    expect(label({ type: "New" })).toBe("신규");
  });

  it("타입을 벗어난 값이 런타임에 들어오면 throw 한다", () => {
    expect(() => label({ type: "Read" } as unknown as Status)).toThrow(
      'Unexpected value: {"type":"Read"}',
    );
  });
});
