import "server-only";
import { getPublishedWorks } from "@/application/works/get-published-works";
import { container, dataStore } from "@/infrastructure/container";

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

type Env = Readonly<Record<string, string | undefined>>;

/**
 * GET /api/keepalive. Vercel cron(vercel.json)이 하루 한 번 불러 Supabase 무료 플랜의 7일 비활성 일시정지를 막는다.
 * 캐시를 거치지 않고 공개 작업을 실제로 한 번 읽는다 (작업 수십 개라 가볍다).
 * CRON_SECRET 이 있으면 Vercel cron 이 붙이는 `Authorization: Bearer <CRON_SECRET>` 만 받는다.
 * 실패하면 503 이라 Vercel 대시보드의 cron 기록과 함수 로그에서 보인다 (docs/ops-manual.md)
 */
export async function keepStoreAwake(
  request: Request,
  env: Env = process.env,
): Promise<Response> {
  const secret = env.CRON_SECRET?.trim();
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`)
    return json(401, { ok: false });
  if (dataStore === "memory") return json(200, { ok: true, store: dataStore });
  try {
    const works = await getPublishedWorks({ repo: container.workRepository })();
    return json(200, { ok: true, store: dataStore, works: works.length });
  } catch (cause) {
    console.error("[works] keepalive: 저장소를 읽지 못했다", cause);
    return json(503, { ok: false, store: dataStore });
  }
}

const json = (status: number, body: Record<string, unknown>) =>
  Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
