import "server-only";
import { cache } from "react";
import {
  allowedInquiryActions,
  countInquiries,
  getInquiry,
  listInquiries,
} from "@/application/inquiry/admin-inquiries";
import { requireAdmin } from "@/features/admin-auth/queries";
import { container } from "@/infrastructure/container";
import {
  toAdminInquiryDetailView,
  toAdminInquiryListView,
  type InquiryListParams,
} from "./admin-view";

// 관리자 문의 읽기 (19칸). 요청의 관리자 세션 저장소로 읽고 캐시하지 않는다 (상태를 바꾸면 다음 화면에 바로 보인다).
// 관리자가 아니면 로그인 화면으로 (돌아올 곳: returnTo). 데이터는 RLS 도 한 번 더 막는다 (docs/adr/0012)

export async function listAdminInquiries(
  params: InquiryListParams,
  returnTo: string,
) {
  await requireAdmin(returnTo);
  const repo = await container.inquiry.admin();
  return toAdminInquiryListView(await listInquiries({ repo })(params));
}

// 상세 화면의 제목(generateMetadata)과 본문이 같은 요청에서 부른다. 한 번만 읽는다
const findForRequest = cache(async (id: string) =>
  getInquiry({ repo: await container.inquiry.admin() })(id),
);

/** 없거나 형식이 틀린 id 면 null */
export async function getAdminInquiry(id: string, returnTo: string) {
  await requireAdmin(returnTo);
  const inquiry = await findForRequest(id);
  return inquiry
    ? toAdminInquiryDetailView(inquiry, allowedInquiryActions(inquiry.status))
    : null;
}

// 관리자 메뉴의 "새 문의 N건"과 목록의 상태별 개수. 한 요청에서 여러 번 불러도 한 번만 센다
const countForRequest = cache(async () =>
  countInquiries({ repo: await container.inquiry.admin() })(),
);

export async function countAdminInquiries(returnTo: string) {
  await requireAdmin(returnTo);
  return countForRequest();
}
