import type { Inquiry, InquiryId } from "@/domain/inquiry/inquiry";

// 문의 저장소 포트. 구현: infrastructure/inquiry (인메모리, 14칸 Supabase).
// 두 구현은 infrastructure/inquiry/inquiry-repository.contract.ts 를 같이 통과해야 한다.
// 저장소 장애는 Promise 거부로 알린다. 유스케이스가 받아서 Result 에러로 바꾼다
export type InquiryRepository = {
  /** 같은 id 가 있으면 덮어쓴다 (새 문의 저장, 상태 변경 모두) */
  save(inquiry: Inquiry): Promise<void>;
  /** 없으면 null */
  findById(id: InquiryId): Promise<Inquiry | null>;
  /** 전체. 순서는 정해져 있지 않다 (관리자 목록은 범위로 자르는 AdminInquiryRepository.findPage) */
  findAll(): Promise<readonly Inquiry[]>;
};
