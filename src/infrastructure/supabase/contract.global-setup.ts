import {
  readAllInquiryRows,
  replaceAllInquiryRows,
} from "../inquiry/supabase-inquiry-writer";
import { seedWorks } from "../works/seed";
import { replaceAllWorks } from "../works/supabase-work-writer";
import { hasSupabaseEnv, secretClient } from "./contract-support";

// 계약 테스트는 테이블을 비우고 테스트 데이터를 넣는다. 같은 DB 를 개발 화면도 쓰므로
// 시작할 때 문의를 백업해 두고, 끝나면 works 는 시드로, 문의는 백업으로 되돌린다
export default async function setup() {
  if (!hasSupabaseEnv) {
    console.info("[contract] Supabase env 가 없어 계약 테스트를 건너뛴다");
    return;
  }
  const client = secretClient();
  const inquiries = await readAllInquiryRows(client);

  return async () => {
    await replaceAllWorks(client, seedWorks);
    await replaceAllInquiryRows(client, inquiries);
    console.info(
      `[contract] works 시드 ${seedWorks.length}개, 문의 ${inquiries.length}개를 되돌렸다`,
    );
  };
}
