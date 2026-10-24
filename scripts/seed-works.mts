// works 테이블을 코드의 시드(src/infrastructure/works/seed.ts)로 되돌린다. 문의는 건드리지 않는다.
// 사용: pnpm db:seed (.env.local 의 Supabase 값, 또는 CI 의 환경 변수)
// 리포지토리 모듈이 server-only 를 import 해서 --conditions=react-server 로 실행한다 (package.json)
import {
  readSupabaseServerEnv,
  createSupabaseServerClient,
} from "@/infrastructure/supabase/client";
import { seedWorks } from "@/infrastructure/works/seed";
import { replaceAllWorks } from "@/infrastructure/works/supabase-work-writer";

const env = readSupabaseServerEnv({ ...process.env, DATA_STORE: undefined });
if (!env) {
  console.info("[db:seed] Supabase env 가 없어 건너뛴다");
} else {
  await replaceAllWorks(createSupabaseServerClient(env), seedWorks);
  console.info(`[db:seed] works 시드 ${seedWorks.length}개를 넣었다`);
}
