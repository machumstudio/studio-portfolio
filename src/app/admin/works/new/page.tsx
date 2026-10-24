import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/features/admin-auth/queries";
import {
  deleteWorkAction,
  preparePhotoUploadAction,
  saveWorkAction,
} from "@/features/works/actions";
import { newWorkFormValues } from "@/features/works/admin-view";
import { newWorkId } from "@/features/works/queries";
import { WorkEditor } from "@/features/works/ui/WorkEditor";
import { AdminShell } from "../../_components/admin-shell";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "ko", namespace: "AdminWorks" });
  return { title: t("metadata.new") };
}

// /admin/works/new: 새 작업. id 는 서버가 정해 넘기고, 사진은 저장 전에 그 작업 폴더에 올린다.
// 저장하면 편집 화면(/admin/works/[id])으로 바뀐다. 편집 화면은 JS 를 전제로 한다 (docs/adr/0015)
export default async function NewWorkPage() {
  const admin = await requireAdmin("/admin/works/new");
  const id = await newWorkId("/admin/works/new");
  return (
    <AdminShell email={admin.email} section="works" needsScript>
      <WorkEditor
        initial={newWorkFormValues(id)}
        actions={{
          save: saveWorkAction,
          remove: deleteWorkAction,
          prepareUpload: preparePhotoUploadAction,
        }}
      />
    </AdminShell>
  );
}
