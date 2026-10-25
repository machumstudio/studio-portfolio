import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/features/admin-auth/queries";
import {
  deleteWorkAction,
  preparePhotoUploadAction,
  saveWorkAction,
} from "@/features/works/actions";
import { toWorkFormValues } from "@/features/works/admin-view";
import { getAdminWork } from "@/features/works/queries";
import { WorkEditor } from "@/features/works/ui/WorkEditor";
import { AdminShell } from "../../_components/admin-shell";
import { ForgetResultParam } from "../../_components/forget-result-param";

export async function generateMetadata({
  params,
}: PageProps<"/admin/works/[id]">): Promise<Metadata> {
  const { id } = await params;
  const work = await getAdminWork(id, `/admin/works/${id}`);
  const t = await getTranslations({ locale: "ko", namespace: "AdminWorks" });
  return {
    title: work
      ? t("metadata.edit", { title: work.title.ko })
      : t("notFound.metadata"),
  };
}

// /admin/works/[id]: 작업 고치기. 없거나 형식이 틀린 id 는 404 (app/admin/not-found.tsx)
export default async function EditWorkPage({
  params,
  searchParams,
}: PageProps<"/admin/works/[id]">) {
  const { id } = await params;
  const returnTo = `/admin/works/${id}`;
  const admin = await requireAdmin(returnTo);
  const work = await getAdminWork(id, returnTo);
  if (!work) notFound();
  const { created } = await searchParams;
  return (
    <AdminShell email={admin.email} section="works" needsScript>
      <WorkEditor
        initial={toWorkFormValues(work)}
        actions={{
          save: saveWorkAction,
          remove: deleteWorkAction,
          prepareUpload: preparePhotoUploadAction,
        }}
        notice={created === "1" ? "created" : undefined}
      />
      {created !== undefined && <ForgetResultParam name="created" />}
    </AdminShell>
  );
}
