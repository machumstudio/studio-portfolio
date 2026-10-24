import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/features/admin-auth/queries";
import {
  changeInquiryStatusAction,
  deleteInquiryAction,
} from "@/features/inquiry/actions";
import {
  inquiryDetailHref,
  parseDetailNotice,
} from "@/features/inquiry/admin-view";
import { getAdminInquiry } from "@/features/inquiry/queries";
import { AdminInquiryDetail } from "@/features/inquiry/ui/AdminInquiryDetail";
import { AdminShell } from "../../_components/admin-shell";

// 제목에 이름을 넣지 않는다: 브라우저 방문 기록과 탭 제목에 개인정보가 남지 않게.
// 문의는 요청 하나에 한 번만 읽는다 (페이지와 같이 getAdminInquiry)
export async function generateMetadata({
  params,
}: PageProps<"/admin/inquiries/[id]">): Promise<Metadata> {
  const { id } = await params;
  const inquiry = await getAdminInquiry(id, inquiryDetailHref(id));
  const t = await getTranslations({
    locale: "ko",
    namespace: "AdminInquiries",
  });
  return { title: inquiry ? t("metadata.detail") : t("metadata.notFound") };
}

// /admin/inquiries/[id]: 문의 상세. 없거나 형식이 틀린 id 는 404 (../not-found.tsx).
// 열기만 해서는 상태를 바꾸지 않는다 (AdminInquiryDetail)
export default async function AdminInquiryPage({
  params,
  searchParams,
}: PageProps<"/admin/inquiries/[id]">) {
  const { id } = await params;
  const returnTo = inquiryDetailHref(id);
  const admin = await requireAdmin(returnTo);
  const inquiry = await getAdminInquiry(id, returnTo);
  if (!inquiry) notFound();
  const { notice } = await searchParams;
  return (
    <AdminShell email={admin.email} section="inquiries">
      <AdminInquiryDetail
        inquiry={inquiry}
        notice={parseDetailNotice(notice)}
        actions={{
          changeStatus: changeInquiryStatusAction,
          remove: deleteInquiryAction,
        }}
      />
    </AdminShell>
  );
}
