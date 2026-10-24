import type { Inquiry } from "@/domain/inquiry/inquiry";

// 새 문의 알림 포트. 구현: 15칸 (Resend 이메일 또는 Slack 웹훅).
// 실패는 Promise 거부로 알린다. 알림이 실패해도 문의는 저장된 채로 둔다 (docs/adr/0007)
export type Notifier = {
  notifyNewInquiry(inquiry: Inquiry): Promise<void>;
};
