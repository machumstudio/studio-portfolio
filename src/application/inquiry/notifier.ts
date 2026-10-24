import type { Inquiry } from "@/domain/inquiry/inquiry";

// 새 문의 알림 포트. 구현: infrastructure/inquiry 의 Resend 이메일, 서버 로그 (container 가 env 로 고른다).
// 실패는 Promise 거부로 알린다. 알림이 실패해도 문의는 저장된 채로 둔다 (docs/adr/0007)
export type Notifier = {
  notifyNewInquiry(inquiry: Inquiry): Promise<void>;
};
