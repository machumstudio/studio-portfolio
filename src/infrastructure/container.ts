import "server-only";
import { createInMemoryInquiryRepository } from "./inquiry/in-memory-inquiry-repository";
import { createLogNotifier } from "./inquiry/log-notifier";
import { createResendNotifier, readResendEnv } from "./inquiry/resend-notifier";
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
// 알림: Resend env(키 + 받는 주소)가 있으면 이메일, 없거나 DATA_STORE=memory 면 서버 로그.
// e2e(playwright.config.ts)와 CI 빌드는 인메모리 + 로그라 클라우드 DB 를 건드리지 않고 메일도 보내지 않는다
const supabaseEnv = readSupabaseServerEnv();
const supabase = supabaseEnv ? createSupabaseServerClient(supabaseEnv) : null;

export const dataStore: "supabase" | "memory" = supabase
  ? "supabase"
  : "memory";

const resendEnv = readResendEnv();

export const notifierKind: "resend" | "log" = resendEnv ? "resend" : "log";

export const container = {
  workRepository: supabase
    ? createSupabaseWorkRepository(supabase)
    : createInMemoryWorkRepository(seedWorks),
  inquiry: {
    // 인메모리 문의는 서버 프로세스가 다시 뜨면 비워진다
    repo: supabase
      ? createSupabaseInquiryRepository(supabase)
      : createInMemoryInquiryRepository(),
    notifier: resendEnv ? createResendNotifier(resendEnv) : createLogNotifier(),
    clock: systemClock,
    ids: randomInquiryIds,
  },
};
