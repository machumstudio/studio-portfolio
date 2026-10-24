import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/features/admin-auth/queries";
import { toAdminWorkRow } from "@/features/works/admin-view";
import { listAdminWorks } from "@/features/works/queries";
import { AdminWorkList } from "@/features/works/ui/AdminWorkList";
import { AdminShell } from "./_components/admin-shell";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "ko", namespace: "AdminWorks" });
  return { title: t("metadata.list") };
}

// /admin: 작업 목록 (비공개 포함, 최신순). 19칸 문의 관리가 들어오면 메뉴를 나눈다.
// proxy 를 지나왔어도 여기서 인증 서버에 세션을 다시 확인한다 (requireAdmin)
export default async function AdminWorksPage({
  searchParams,
}: PageProps<"/admin">) {
  const admin = await requireAdmin("/admin");
  const works = await listAdminWorks("/admin");
  const { deleted } = await searchParams;
  return (
    <AdminShell email={admin.email}>
      <AdminWorkList
        works={works.map(toAdminWorkRow)}
        notice={deleted === "1" ? "deleted" : undefined}
      />
    </AdminShell>
  );
}
