import type { InquiryRepository } from "@/application/inquiry/inquiry-repository";
import type { Inquiry, InquiryId } from "@/domain/inquiry/inquiry";

// 14칸 Supabase 어댑터 전까지 쓰는 저장소. 서버 프로세스 메모리라 재시작하면 비워진다
export function createInMemoryInquiryRepository(
  inquiries: readonly Inquiry[] = [],
): InquiryRepository {
  const store = new Map<InquiryId, Inquiry>(inquiries.map((i) => [i.id, i]));
  return {
    save: async (inquiry) => {
      store.set(inquiry.id, inquiry);
    },
    findById: async (id) => store.get(id) ?? null,
    findAll: async () => [...store.values()],
  };
}
