import "server-only";
import { getAdminWork } from "@/application/works/admin-works";
import { container, type CookieJar } from "@/infrastructure/container";

// proxy(src/proxy.ts)가 관리자 작업 편집 주소를 그리기 전에 작업이 있는지 본다 (features/inquiry/proxy-check.ts 와 같은 이유, docs/adr/0019).
// 장애로 알 수 없으면 있다고 보고 페이지에 맡긴다
export async function workExists(
  cookies: CookieJar,
  id: string,
): Promise<boolean> {
  try {
    const { repo } = await container.works.admin(cookies);
    return (await getAdminWork({ repo })(id)) !== null;
  } catch (cause) {
    console.error(
      `[works] proxy 에서 작업 ${id} 가 있는지 확인하지 못했다`,
      cause,
    );
    return true;
  }
}
