import type { Notifier } from "@/application/inquiry/notifier";

type Log = (message: string) => void;

// 15칸 이메일/Slack 알림 전까지 쓰는 알림. 서버 로그에 새 문의가 왔다는 것만 남긴다.
// 이름, 이메일, 연락처, 메시지는 로그에 남기지 않는다 (개인정보는 저장소에만 둔다)
export function createLogNotifier(log: Log = console.info): Notifier {
  return {
    notifyNewInquiry: async (inquiry) => {
      log(
        `[inquiry] 새 문의 ${inquiry.id} (${inquiry.receivedAt.toISOString()})`,
      );
    },
  };
}
