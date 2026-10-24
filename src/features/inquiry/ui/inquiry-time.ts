import { useFormatter } from "next-intl";

// 관리자 화면의 시각은 한국 시간(KST)으로 고정한다. 서버(Vercel, UTC)와 브라우저의 시간대와 상관없이 같게 보인다
export const adminTimeZone = "Asia/Seoul";

export function useAdminDateTime() {
  const format = useFormatter();
  return (date: Date) =>
    format.dateTime(date, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: adminTimeZone,
    });
}
