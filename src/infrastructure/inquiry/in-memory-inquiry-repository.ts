import type { AdminInquiryRepository } from "@/application/inquiry/admin-inquiry-repository";
import type { Inquiry, InquiryId } from "@/domain/inquiry/inquiry";

// 최신순, 같은 시각이면 id 역순 (Supabase 의 order by received_at desc, id desc 와 같다)
const newestFirst = (a: Inquiry, b: Inquiry) =>
  b.receivedAt.getTime() - a.receivedAt.getTime() ||
  (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);

// Supabase env 가 없거나 DATA_STORE=memory(e2e) 일 때 쓰는 저장소. 서버 프로세스 메모리라 재시작하면 비워진다
export function createInMemoryInquiryRepository(
  inquiries: readonly Inquiry[] = [],
): AdminInquiryRepository {
  const store = new Map<InquiryId, Inquiry>(inquiries.map((i) => [i.id, i]));
  return {
    save: async (inquiry) => {
      store.set(inquiry.id, inquiry);
    },
    findById: async (id) => store.get(id) ?? null,
    findAll: async () => [...store.values()],
    countByStatus: async () => {
      const counts = { New: 0, Read: 0, Done: 0 };
      for (const inquiry of store.values()) counts[inquiry.status.type] += 1;
      return counts;
    },
    findPage: async ({ status, offset, limit }) =>
      [...store.values()]
        .filter((inquiry) => !status || inquiry.status.type === status)
        .sort(newestFirst)
        .slice(offset, offset + limit),
    remove: async (id) => store.delete(id),
  };
}
