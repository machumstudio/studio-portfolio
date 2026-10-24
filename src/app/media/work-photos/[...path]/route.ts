import { connection } from "next/server";
import { serveMemoryPhoto } from "@/features/works/routes";

// 인메모리 사진 저장소의 사진 주소 (DATA_STORE=memory). Supabase 를 쓰면 404 (사진은 Storage 주소에 있다).
// 파일이 서버 메모리에서 바뀌므로 빌드 때 미리 만들지 않는다
export async function GET(
  _request: Request,
  { params }: RouteContext<"/media/work-photos/[...path]">,
) {
  await connection();
  const { path } = await params;
  return serveMemoryPhoto(path.join("/"));
}
