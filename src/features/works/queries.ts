import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getAdjacentWorks as getAdjacentWorksUseCase } from "@/application/works/get-adjacent-works";
import {
  getPublishedWorks as getPublishedWorksUseCase,
  type GetPublishedWorksOptions,
} from "@/application/works/get-published-works";
import { getWorkBySlug as getWorkBySlugUseCase } from "@/application/works/get-work-by-slug";
import { getWorkGalleries as getWorkGalleriesUseCase } from "@/application/works/get-work-galleries";
import { container } from "@/infrastructure/container";

// RSC 에서 부르는 작업 읽기. 유스케이스에 container 의 저장소를 꽂기만 한다.
// 저장소가 Supabase 면 읽기가 네트워크 요청이라, cacheComponents 에서 페이지를 미리 만들려면 캐시해야 한다.
// 작업은 관리자가 저장할 때만 바뀐다: 18칸 저장 액션이 updateTag(worksCacheTag) 로 비우고,
// 대시보드에서 직접 고친 경우를 위해 시간 기준으로도 한 시간마다 다시 읽는다
export const worksCacheTag = "works";

const repo = container.workRepository;

const cached = () => {
  cacheLife("hours");
  cacheTag(worksCacheTag);
};

export async function getPublishedWorks(options?: GetPublishedWorksOptions) {
  "use cache";
  cached();
  return getPublishedWorksUseCase({ repo })(options);
}

export async function getWorkGalleries(category?: string) {
  "use cache";
  cached();
  return getWorkGalleriesUseCase({ repo })(category);
}

export async function getWorkBySlug(slug: string) {
  "use cache";
  cached();
  return getWorkBySlugUseCase({ repo })(slug);
}

export async function getAdjacentWorks(slug: string) {
  "use cache";
  cached();
  return getAdjacentWorksUseCase({ repo })(slug);
}
