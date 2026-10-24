import "server-only";
import { container } from "@/infrastructure/container";

// 인메모리 사진 저장소의 HTTP 입구 (DATA_STORE=memory 인 e2e, 로컬). app 의 route handler 가 부른다.
// Supabase 를 쓰면 브라우저가 Storage 로 바로 올리고 Storage 주소에서 읽으므로 둘 다 404 다.
// 업로드는 서버 액션이 관리자 확인 뒤 내준 한 번 쓰는 토큰으로만 된다 (Supabase 서명 업로드 주소와 같다)

const notFound = () => new Response(null, { status: 404 });

/** PUT /admin/uploads/[token] */
export async function receiveMemoryUpload(
  request: Request,
  token: string,
): Promise<Response> {
  const storage = container.works.memoryPhotos;
  if (!storage) return notFound();
  const type = request.headers.get("content-type") ?? "";
  const body = new Uint8Array(await request.arrayBuffer());
  switch (storage.receive(token, type, body)) {
    case "stored":
      return new Response(null, { status: 200 });
    case "not-found":
      return notFound();
    case "rejected":
      return new Response(null, { status: 400 });
  }
}

/** GET /media/work-photos/[...path] */
export async function serveMemoryPhoto(path: string): Promise<Response> {
  const photo = container.works.memoryPhotos?.read(path);
  if (!photo) return notFound();
  return new Response(photo.body, {
    headers: {
      "content-type": photo.type,
      "cache-control": "public, max-age=3600",
      // 사진으로만 읽게 한다 (형식을 짐작해 페이지로 열지 않게)
      "x-content-type-options": "nosniff",
    },
  });
}
