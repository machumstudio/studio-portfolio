import { connection } from "next/server";
import { keepStoreAwake } from "@/features/works/routes";

// Supabase 일시정지 막기. Vercel cron(vercel.json)이 하루 한 번 부른다 (docs/ops-manual.md).
// 부를 때마다 저장소를 실제로 읽어야 해서 빌드 때 미리 만들지 않는다
export async function GET(request: Request) {
  await connection();
  return keepStoreAwake(request);
}
