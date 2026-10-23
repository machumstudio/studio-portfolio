import "server-only";
import { createInMemoryWorkRepository } from "./works/in-memory-work-repository";
import { seedWorks } from "./works/seed";

// 포트 구현 조립. features 의 actions.ts / queries.ts 만 이 파일을 쓴다.
// 14칸에서 Supabase 구현으로 바꿀 때 이 파일만 고친다
export const container = {
  workRepository: createInMemoryWorkRepository(seedWorks),
};
