"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef, useState, useTransition } from "react";
import { buttonStyles } from "@/components/ui/Button";
import type { DeleteWorkState } from "../form-state";

type DeleteWorkDialogProps = {
  title: string;
  photoCount: number;
  /** 성공하면 서버가 목록으로 redirect 한다. 실패만 상태로 돌아온다 */
  onConfirm: () => Promise<DeleteWorkState | void>;
};

// 작업 지우기 확인 단계. 네이티브 <dialog> 의 showModal: 바깥은 inert, Esc 로 닫힘, 닫으면 여는 버튼으로 포커스가 돌아간다.
// 처음 포커스는 "취소"(먼저 나오는 버튼)라 Enter 를 눌러도 바로 지워지지 않는다
export function DeleteWorkDialog({
  title,
  photoCount,
  onConfirm,
}: DeleteWorkDialogProps) {
  const t = useTranslations("AdminWorks");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const bodyId = useId();
  const [pending, startTransition] = useTransition();
  const [failure, setFailure] = useState<DeleteWorkState["code"] | null>(null);

  const open = () => {
    setFailure(null);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  const confirm = () => {
    if (pending) return;
    startTransition(async () => {
      let state: DeleteWorkState | void;
      try {
        state = await onConfirm();
      } catch {
        state = { status: "error", code: "unavailable" };
      }
      if (state) setFailure(state.code);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={buttonStyles({ variant: "outline" })}
      >
        <Trash2 aria-hidden />
        {t("editor.delete")}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="m-auto w-full max-w-md rounded-10 p-7.5 text-white surface-raised backdrop:bg-black/70"
      >
        <div className="flex flex-col gap-5">
          <h2 id={titleId} className="text-h4">
            {t("deleteDialog.title")}
          </h2>
          <p id={bodyId} className="text-body text-grey-70">
            {t("deleteDialog.body", { title, count: photoCount })}
          </p>
          <p role="status" className="text-body text-purple-80 empty:hidden">
            {failure ? t(`failures.${failure}`) : ""}
          </p>
          <div className="flex flex-wrap justify-end gap-2.5">
            <button
              type="button"
              onClick={close}
              className={buttonStyles({ variant: "outline" })}
            >
              {t("deleteDialog.cancel")}
            </button>
            <button
              type="button"
              onClick={confirm}
              aria-disabled={pending || undefined}
              className={buttonStyles({
                className: "aria-disabled:cursor-wait aria-disabled:opacity-50",
              })}
            >
              {pending ? t("deleteDialog.deleting") : t("deleteDialog.confirm")}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
