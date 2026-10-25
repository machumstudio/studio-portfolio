import "server-only";
import { getInquiry } from "@/application/inquiry/admin-inquiries";
import { container, type CookieJar } from "@/infrastructure/container";

// proxy(src/proxy.ts)가 관리자 문의 상세 주소를 그리기 전에 문의가 있는지 본다.
// 관리자 화면은 정적 껍데기 + 나중에 채우는 응답(PPR resume)이라, 페이지의 notFound() 는 상태 코드를 200 에서 바꾸지 못한다.
// 없는 문의는 proxy 가 404 화면으로 rewrite 해 상태 코드도 404 가 된다 (docs/adr/0019).
// 관리자인지는 proxy 가 빠르게 확인한 뒤에만 부른다. 저장소는 요청의 관리자 세션이라 RLS 도 그대로다.
// 장애로 알 수 없으면 있다고 보고 페이지에 맡긴다 (페이지가 다시 읽어 알맞은 화면을 그린다)
export async function inquiryExists(
  cookies: CookieJar,
  id: string,
): Promise<boolean> {
  try {
    return (
      (await getInquiry({ repo: await container.inquiry.admin(cookies) })(
        id,
      )) !== null
    );
  } catch (cause) {
    console.error(
      `[inquiry] proxy 에서 문의 ${id} 가 있는지 확인하지 못했다`,
      cause,
    );
    return true;
  }
}
