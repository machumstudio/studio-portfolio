import "server-only";
import type { AuthGateway } from "@/application/admin-auth/auth-gateway";
import type { AdminWorkRepository } from "@/application/works/admin-work-repository";
import type { IdGenerator } from "@/application/works/clock";
import type { PhotoStorage } from "@/application/works/photo-storage";
import { createInMemoryAuth } from "./admin-auth/in-memory-auth";
import { memoryAccounts } from "./admin-auth/memory-accounts";
import { disabledAuthGateway, readAdminAuthMode } from "./admin-auth/mode";
import { nextCookieJar } from "./admin-auth/next-cookie-jar";
import {
  createSupabaseAuthGateway,
  createSupabaseCookieClient,
} from "./admin-auth/supabase-auth-gateway";
import { createInMemoryInquiryRepository } from "./inquiry/in-memory-inquiry-repository";
import { createLogNotifier } from "./inquiry/log-notifier";
import { createResendNotifier, readResendEnv } from "./inquiry/resend-notifier";
import { createSupabaseInquiryRepository } from "./inquiry/supabase-inquiry-repository";
import { randomInquiryIds, systemClock } from "./inquiry/system";
import {
  createSupabaseServerClient,
  readSupabaseServerEnv,
} from "./supabase/client";
import { createInMemoryPhotoStorage } from "./works/in-memory-photo-storage";
import { createInMemoryWorkRepository } from "./works/in-memory-work-repository";
import { seedWorks } from "./works/seed";
import { createSupabasePhotoStorage } from "./works/supabase-photo-storage";
import { createSupabaseWorkRepository } from "./works/supabase-work-repository";

// 포트 구현 조립. features 의 actions.ts / queries.ts 만 이 파일을 쓴다.
// 저장소: Supabase env(URL + secret 키)가 있으면 Supabase, 없거나 DATA_STORE=memory 면 인메모리.
// 알림: Resend env(키 + 받는 주소)가 있으면 이메일, 없거나 DATA_STORE=memory 면 서버 로그.
// 관리자 인증: Supabase Auth, DATA_STORE=memory 면 테스트 계정, 둘 다 아니면 꺼짐 (admin-auth/mode.ts).
// 관리자 작업: 요청의 관리자 세션으로 만든 Supabase 클라이언트(RLS, docs/adr/0012), DATA_STORE=memory 면 인메모리.
// e2e(playwright.config.ts)와 CI 빌드는 인메모리 + 로그라 클라우드 DB 를 건드리지 않고 메일도 보내지 않는다
const supabaseEnv = readSupabaseServerEnv();
const supabase = supabaseEnv ? createSupabaseServerClient(supabaseEnv) : null;

export const dataStore: "supabase" | "memory" = supabase
  ? "supabase"
  : "memory";

const resendEnv = readResendEnv();

export const notifierKind: "resend" | "log" = resendEnv ? "resend" : "log";

const authMode = readAdminAuthMode();

export const adminAuthKind: "supabase" | "memory" | "disabled" = authMode.kind;

// 인메모리 세션은 서버 프로세스 하나에 하나
const memoryAuth =
  authMode.kind === "memory" ? createInMemoryAuth(memoryAccounts) : null;

// 요청마다 그 요청의 쿠키에 묶인 AuthGateway.
// 꺼짐 모드도 쿠키를 읽는다: 관리자 화면이 모드와 상관없이 요청마다 그려지게 (빌드 때 redirect 가 굳지 않게)
async function openAuthGateway(): Promise<AuthGateway> {
  const jar = await nextCookieJar();
  switch (authMode.kind) {
    case "supabase":
      return createSupabaseAuthGateway(authMode.env, jar);
    case "memory":
      return memoryAuth ? memoryAuth.gateway(jar) : disabledAuthGateway;
    case "disabled":
      return disabledAuthGateway;
  }
}

// 서버 프로세스에 하나만 있어야 하는 인메모리 상태. next start 는 페이지/서버 액션과 route handler 를
// 따로 묶어서 이 모듈이 두 번 실행될 수 있다 (업로드 PUT 이 서버 액션이 만든 토큰을 모르게 된다).
// globalThis 에 두어 같은 프로세스의 모든 묶음이 같은 인스턴스를 쓴다
const processSingleton = <T>(key: string, create: () => T): T => {
  const store = globalThis as unknown as Record<symbol, T | undefined>;
  const symbol = Symbol.for(`machum.container.${key}`);
  return (store[symbol] ??= create());
};

// 인메모리 작업과 사진. 공개 화면과 관리자 화면이 같은 인스턴스를 써야 저장한 작업이 공개 화면에 보인다
const workRepository = supabase
  ? createSupabaseWorkRepository(supabase)
  : processSingleton("memoryWorks", () =>
      createInMemoryWorkRepository(seedWorks),
    );
const memoryWorks = supabase ? null : workRepository;
const memoryPhotos =
  authMode.kind === "memory"
    ? processSingleton("memoryPhotos", () =>
        createInMemoryPhotoStorage({ clock: systemClock }),
      )
    : null;

export type AdminWorks = { repo: AdminWorkRepository; storage: PhotoStorage };

// 요청마다 그 요청의 관리자 세션에 묶인 작업 저장소와 사진 저장소. secret 키는 쓰지 않는다.
// 공개 읽기와 같은 저장소를 봐야 해서, 공개 작업이 Supabase 일 때만 Supabase Auth 세션으로 쓴다.
// 호출하는 쪽(features)은 먼저 requireAdmin 으로 관리자를 확인한다
async function openAdminWorks(): Promise<AdminWorks> {
  if (supabaseEnv && authMode.kind === "supabase") {
    const client = createSupabaseCookieClient(
      authMode.env,
      await nextCookieJar(),
    );
    return {
      repo: createSupabaseWorkRepository(client),
      storage: createSupabasePhotoStorage(client, supabaseEnv.url),
    };
  }
  if (authMode.kind === "memory" && memoryWorks && memoryPhotos)
    return { repo: memoryWorks, storage: memoryPhotos };
  throw new Error("[container] 관리자 작업 저장소가 꺼져 있다");
}

/** 새 작업 id, 사진 파일 이름: UUID v4 (공개 버킷 주소에서 짐작할 수 없게, docs/adr/0014) */
const randomIds: IdGenerator = { next: () => crypto.randomUUID() };

export const container = {
  workRepository,
  inquiry: {
    // 인메모리 문의는 서버 프로세스가 다시 뜨면 비워진다
    repo: supabase
      ? createSupabaseInquiryRepository(supabase)
      : createInMemoryInquiryRepository(),
    notifier: resendEnv ? createResendNotifier(resendEnv) : createLogNotifier(),
    clock: systemClock,
    ids: randomInquiryIds,
  },
  adminAuth: { gateway: openAuthGateway },
  works: {
    admin: openAdminWorks,
    clock: systemClock,
    ids: randomIds,
    /** 인메모리 업로드/사진 주소(app 의 route handler)가 쓴다. Supabase 면 null */
    memoryPhotos,
  },
};
