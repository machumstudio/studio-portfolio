import "server-only";
import { createInMemoryInquiryRepository } from "./inquiry/in-memory-inquiry-repository";
import { createLogNotifier } from "./inquiry/log-notifier";
import { randomInquiryIds, systemClock } from "./inquiry/system";
import { createInMemoryWorkRepository } from "./works/in-memory-work-repository";
import { seedWorks } from "./works/seed";

// 포트 구현 조립. features 의 actions.ts / queries.ts 만 이 파일을 쓴다.
// 14칸에서 Supabase 구현으로, 15칸에서 이메일/Slack 알림으로 바꿀 때 이 파일만 고친다
export const container = {
  workRepository: createInMemoryWorkRepository(seedWorks),
  // 인메모리 문의는 서버 프로세스가 다시 뜨면 비워진다 (14칸 전까지)
  inquiry: {
    repo: createInMemoryInquiryRepository(),
    notifier: createLogNotifier(),
    clock: systemClock,
    ids: randomInquiryIds,
  },
};
