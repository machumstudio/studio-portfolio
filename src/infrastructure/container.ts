import "server-only";
import { createInMemoryInquiryRepository } from "./inquiry/in-memory-inquiry-repository";
import { createLogNotifier } from "./inquiry/log-notifier";
import { createSupabaseInquiryRepository } from "./inquiry/supabase-inquiry-repository";
import { randomInquiryIds, systemClock } from "./inquiry/system";
import {
  createSupabaseServerClient,
  readSupabaseServerEnv,
} from "./supabase/client";
import { createInMemoryWorkRepository } from "./works/in-memory-work-repository";
import { seedWorks } from "./works/seed";
import { createSupabaseWorkRepository } from "./works/supabase-work-repository";

// 포트 구현 조립. features 의 actions.ts / queries.ts 만 이 파일을 쓴다.
// 저장소: Supabase env(URL + secret 키)가 있으면 Supabase, 없거나 DATA_STORE=memory 면 인메모리.
// e2e(playwright.config.ts)와 CI 빌드는 인메모리라 클라우드 DB 를 건드리지 않는다.
// 15칸에서 이메일/Slack 알림으로 바꿀 때 이 파일만 고친다
const supabaseEnv = readSupabaseServerEnv();
const supabase = supabaseEnv ? createSupabaseServerClient(supabaseEnv) : null;

export const dataStore: "supabase" | "memory" = supabase
  ? "supabase"
  : "memory";

export const container = {
  workRepository: supabase
    ? createSupabaseWorkRepository(supabase)
    : createInMemoryWorkRepository(seedWorks),
  inquiry: {
    // 인메모리 문의는 서버 프로세스가 다시 뜨면 비워진다
    repo: supabase
      ? createSupabaseInquiryRepository(supabase)
      : createInMemoryInquiryRepository(),
    notifier: createLogNotifier(),
    clock: systemClock,
    ids: randomInquiryIds,
  },
};
