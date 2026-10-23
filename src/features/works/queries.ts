import "server-only";
import {
  getPublishedWorks as getPublishedWorksUseCase,
  type GetPublishedWorksOptions,
} from "@/application/works/get-published-works";
import { getWorkBySlug as getWorkBySlugUseCase } from "@/application/works/get-work-by-slug";
import { container } from "@/infrastructure/container";

// RSC 에서 부르는 작업 읽기. 유스케이스에 container 의 저장소를 꽂기만 한다
const repo = container.workRepository;

export const getPublishedWorks = (options?: GetPublishedWorksOptions) =>
  getPublishedWorksUseCase({ repo })(options);

export const getWorkBySlug = (slug: string) =>
  getWorkBySlugUseCase({ repo })(slug);
