import type { Brand } from "@/shared/brand";
import { err, ok, type Result } from "@/shared/result";

// 촬영 연월 "YYYY-MM" (시안은 "March 2022" 처럼 월까지만 보인다).
// 같은 길이의 0 채운 문자열이라 문자열 비교가 곧 날짜 순서다
export type YearMonth = Brand<string, "YearMonth">;
export type YearMonthError = { type: "InvalidYearMonth"; value: string };

const pattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export const parseYearMonth = (
  value: string,
): Result<YearMonth, YearMonthError> =>
  pattern.test(value)
    ? ok(value as YearMonth)
    : err({ type: "InvalidYearMonth", value });
