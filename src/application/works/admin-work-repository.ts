import type { Work, WorkId } from "@/domain/works/work";
import type { WorkRepository } from "./work-repository";

/** save 결과. slug 가 다른 작업과 겹치면 저장하지 않고 "slug-taken" */
export type SaveWorkOutcome = "saved" | "slug-taken";

// 관리자 작업 저장소 포트 (18칸). 공개 읽기(WorkRepository)에 쓰기를 더한다.
// 구현: infrastructure/works (인메모리, Supabase 관리자 세션). 두 구현은 work-repository.contract.ts 를 같이 통과한다.
// 저장소 장애는 Promise 거부로 알린다. 유스케이스가 StorageFailed 로 바꾼다
export type AdminWorkRepository = WorkRepository & {
  /** 비공개 포함. 없으면 null */
  findById(id: WorkId): Promise<Work | null>;
  /**
   * 같은 id 가 있으면 사진까지 통째로 바꾸고, 없으면 새로 넣는다. 한 번에 바뀐다 (사진이 반쯤 바뀐 작업이 보이지 않는다).
   * slug 중복은 저장 직전에 다른 관리자가 같은 slug 로 저장한 경우까지 여기서 잡는다
   */
  save(work: Work): Promise<SaveWorkOutcome>;
  /** 작업과 사진 행을 지운다. 없으면 아무 일도 없다 */
  remove(id: WorkId): Promise<void>;
};
