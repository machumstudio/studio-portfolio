import type { InquiryId } from "@/domain/inquiry/inquiry";

// 지금 시각. 테스트에서 고정한다
export type Clock = {
  now(): Date;
};

// 새 문의 ID. 저장 전에 정해야 알림과 결과에 같은 ID 를 쓸 수 있다
export type InquiryIdGenerator = {
  next(): InquiryId;
};
