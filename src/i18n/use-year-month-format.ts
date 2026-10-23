import { useFormatter, type createFormatter } from "next-intl";

type Formatter = ReturnType<typeof createFormatter>;

// 촬영 연월 "YYYY-MM" 을 언어별로 ("2022년 3월", "March 2022").
// 연월만 있는 값이라 시간대와 무관하게 UTC 1일로 읽는다.
// 컴포넌트는 useYearMonthFormat(), generateMetadata 처럼 훅을 못 쓰는 곳은 getFormatter() 결과를 넘긴다
export const formatYearMonth = (format: Formatter, value: string) =>
  format.dateTime(new Date(`${value}-01T00:00:00Z`), {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  });

export function useYearMonthFormat() {
  const format = useFormatter();
  return (value: string) => formatYearMonth(format, value);
}
