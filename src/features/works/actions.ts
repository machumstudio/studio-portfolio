"use server";

import "server-only";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { deleteWork } from "@/application/works/delete-work";
import { preparePhotoUpload } from "@/application/works/prepare-photo-upload";
import { saveWork } from "@/application/works/save-work";
import { getAdmin } from "@/features/admin-auth/queries";
import { container } from "@/infrastructure/container";
import {
  toSaveWorkState,
  toUploadFailure,
  type DeleteWorkState,
  type PrepareUploadResult,
  type SaveWorkState,
} from "./form-state";
import { worksCacheTag } from "./queries";
import { parseWorkForm, toSaveWorkInput, uploadRequestSchema } from "./schema";

// 관리자 작업 편집 화면의 서버 액션 (docs/adr/0015: 편집 화면은 JS 를 전제로 한다).
// 모두 데이터에 닿기 전에 관리자를 다시 확인한다 (proxy 는 서버 액션 POST 를 돌려보내지 않는다).
// 세션이 끝났으면 redirect 하지 않고 signedOut 을 돌려준다: 화면이 입력을 그대로 둔 채 다시 로그인하게 한다.
// 데이터 접근은 관리자 세션 클라이언트라 확인을 빠뜨려도 RLS 가 막는다 (docs/adr/0012).
// 서버 로그에는 작업 id 와 원인만 남긴다

const deps = async () => ({
  ...(await container.works.admin()),
  clock: container.works.clock,
});

export async function saveWorkAction(raw: unknown): Promise<SaveWorkState> {
  if (!(await getAdmin())) return { status: "error", code: "signedOut" };
  const parsed = parseWorkForm(raw);
  if (!parsed.ok) {
    console.warn("[works] 폼 형태가 아닌 작업 저장 요청을 거절했다");
    return { status: "error", code: "malformed" };
  }

  const result = await saveWork(await deps())(toSaveWorkInput(parsed.value));
  if (result.ok) {
    // 공개 화면(홈, 포트폴리오, 상세)의 작업 캐시를 비운다. 다음 요청이 새로 읽는다
    updateTag(worksCacheTag);
    for (const warning of result.value.warnings)
      console.warn(
        `[works] ${warning.type}: 작업 ${result.value.work.id} 은 저장됐지만 사진 파일을 정리하지 못했다`,
        warning.cause,
      );
  } else if (result.error.type === "StorageFailed") {
    console.error(
      `[works] StorageFailed: 작업 ${parsed.value.id} 을 저장하지 못했다`,
      result.error.cause,
    );
  }
  return toSaveWorkState(result, parsed.value);
}

// 성공하면 목록으로 (지운 작업의 편집 화면에 남지 않게)
export async function deleteWorkAction(id: unknown): Promise<DeleteWorkState> {
  if (!(await getAdmin())) return { status: "error", code: "signedOut" };
  if (typeof id !== "string") return { status: "error", code: "malformed" };

  const result = await deleteWork(await deps())(id);
  if (!result.ok) {
    if (result.error.type === "StorageFailed")
      console.error(
        `[works] StorageFailed: 작업 ${id} 을 지우지 못했다`,
        result.error.cause,
      );
    return {
      status: "error",
      code: result.error.type === "NotFound" ? "notFound" : "unavailable",
    };
  }
  updateTag(worksCacheTag);
  for (const warning of result.value.warnings)
    console.warn(
      `[works] ${warning.type}: 작업 ${id} 은 지웠지만 사진 파일을 정리하지 못했다`,
      warning.cause,
    );
  redirect("/admin?deleted=1");
}

// 사진 한 장을 올릴 곳. 브라우저가 이 주소로 직접 PUT 한다 (파일은 서버 액션을 거치지 않는다)
export async function preparePhotoUploadAction(
  raw: unknown,
): Promise<PrepareUploadResult> {
  if (!(await getAdmin())) return { ok: false, code: "signedOut" };
  const parsed = uploadRequestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "malformed" };

  const { storage } = await container.works.admin();
  const result = await preparePhotoUpload({
    storage,
    ids: container.works.ids,
  })(parsed.data);
  if (result.ok) return { ok: true, ticket: result.value };
  if (result.error.type === "StorageFailed")
    console.error(
      `[works] StorageFailed: 작업 ${parsed.data.workId} 의 사진 올릴 곳을 만들지 못했다`,
      result.error.cause,
    );
  return { ok: false, code: toUploadFailure(result.error) };
}
