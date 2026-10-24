import { receiveMemoryUpload } from "@/features/works/routes";

// 인메모리 사진 저장소의 업로드 주소 (DATA_STORE=memory). Supabase 를 쓰면 404.
// 브라우저가 서버 액션에서 받은 한 번 쓰는 주소로 PUT 한다 (Supabase 서명 업로드 주소와 같은 방식)
export async function PUT(
  request: Request,
  { params }: RouteContext<"/admin/uploads/[token]">,
) {
  const { token } = await params;
  return receiveMemoryUpload(request, token);
}
