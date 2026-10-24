import type { Inquiry, InquiryId } from "@/domain/inquiry/inquiry";
import type { InquiryStatusType } from "@/domain/inquiry/status";
import type { InquiryRepository } from "./inquiry-repository";

/** 상태별 문의 수 */
export type InquiryStatusCounts = Readonly<Record<InquiryStatusType, number>>;

export type InquiryPageQuery = {
  /** null 이면 전체 */
  status: InquiryStatusType | null;
  offset: number;
  limit: number;
};

// 관리자 문의 저장소 포트 (19칸). 공개 쪽 저장(InquiryRepository)에 목록 조회와 지우기를 더한다.
// 구현: infrastructure/inquiry (인메모리, Supabase 관리자 세션). 두 구현은 inquiry-repository.contract.ts 를 같이 통과한다.
// 목록은 전부 읽지 않고 저장소에서 범위로 자른다: 문의가 쌓여도 한 번에 한 페이지만 오가고,
// Supabase(PostgREST)의 응답 행 수 한도(기본 1000)에 걸려 뒤쪽 문의가 조용히 빠지지 않는다.
// 저장소 장애는 Promise 거부로 알린다
export type AdminInquiryRepository = InquiryRepository & {
  /** 상태마다 몇 건인지. 행을 읽지 않고 센다 */
  countByStatus(): Promise<InquiryStatusCounts>;
  /** 받은 시각 최신순(같으면 id 역순으로 늘 같은 순서), offset 부터 limit 건 */
  findPage(query: InquiryPageQuery): Promise<readonly Inquiry[]>;
  /** 지웠으면 true, 이미 없었으면 false */
  remove(id: InquiryId): Promise<boolean>;
};
