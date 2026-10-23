import { describe, expect, it } from "vitest";
import { err, ok } from "@/shared/result";
import { parseYearMonth } from "./year-month";

describe("parseYearMonth", () => {
  it.each(["2022-03", "1999-12", "2024-01"])("%s 는 받는다", (value) => {
    expect(parseYearMonth(value)).toEqual(ok(value));
  });

  it.each([
    "",
    "2022-3",
    "2022-00",
    "2022-13",
    "22-03",
    "2022-03-01",
    "2022/03",
    "March 2022",
  ])("%j 는 InvalidYearMonth", (value) => {
    expect(parseYearMonth(value)).toEqual(
      err({ type: "InvalidYearMonth", value }),
    );
  });
});
