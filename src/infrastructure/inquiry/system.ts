import type { Clock, InquiryIdGenerator } from "@/application/inquiry/clock";
import type { InquiryId } from "@/domain/inquiry/inquiry";

// 서버 시각
export const systemClock: Clock = { now: () => new Date() };

// 새 문의 ID 는 UUID v4. 14칸 Supabase 의 uuid 칼럼에 그대로 들어가고, 주소에 넣어도 순서를 짐작할 수 없다
export const randomInquiryIds: InquiryIdGenerator = {
  next: () => crypto.randomUUID() as InquiryId,
};
