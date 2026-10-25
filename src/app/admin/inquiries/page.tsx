import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/features/admin-auth/queries";
import {
  inquiryListHref,
  parseInquiryListParams,
  parseListNotice,
} from "@/features/inquiry/admin-view";
import { listAdminInquiries } from "@/features/inquiry/queries";
import { AdminInquiryList } from "@/features/inquiry/ui/AdminInquiryList";
import { AdminShell } from "../_components/admin-shell";
import { ForgetResultParam } from "../_components/forget-result-param";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({
    locale: "ko",
    namespace: "AdminInquiries",
  });
  return { title: t("metadata.list") };
}

// /admin/inquiries?status=new&page=2: 문의 목록 (최신순, 상태 필터, 페이지).
// 세션이 끝났으면 로그인 뒤 같은 필터와 페이지로 돌아온다
export default async function AdminInquiriesPage({
  searchParams,
}: PageProps<"/admin/inquiries">) {
  const params = await searchParams;
  const query = parseInquiryListParams(params);
  const returnTo = inquiryListHref(query);
  const admin = await requireAdmin(returnTo);
  const list = await listAdminInquiries(query, returnTo);
  const notice = parseListNotice(params.notice);
  return (
    <AdminShell email={admin.email} section="inquiries">
      <AdminInquiryList list={list} notice={notice} />
      {params.notice !== undefined && <ForgetResultParam name="notice" />}
    </AdminShell>
  );
}
