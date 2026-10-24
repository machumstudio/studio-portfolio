import type { Work, WorkId } from "@/domain/works/work";
import type { AdminWorkRepository } from "./admin-work-repository";
import { newestFirst } from "./get-published-works";
import { isStorableWorkId } from "./photo-paths";

type Deps = { repo: AdminWorkRepository };

/** 관리자 작업 목록: 비공개 포함, 공개 목록과 같은 순서(촬영 연월 최신순) */
export const listAdminWorks =
  ({ repo }: Deps) =>
  async (): Promise<Work[]> =>
    [...(await repo.findAll())].sort(newestFirst);

/** 관리자 편집 화면의 작업. 주소의 id 가 형식에 맞지 않거나 없으면 null */
export const getAdminWork =
  ({ repo }: Deps) =>
  async (id: string): Promise<Work | null> =>
    isStorableWorkId(id) ? repo.findById(id as WorkId) : null;
