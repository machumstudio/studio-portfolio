"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef } from "react";
import { buttonStyles } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";

type DeleteInquiryDialogProps = {
  id: string;
  name: string;
  /** 서버 액션. 끝나면 서버가 목록(또는 실패 알림)으로 redirect 한다 */
  action: (formData: FormData) => Promise<void>;
};

// 문의 지우기 확인 단계 (작업 지우기와 같은 방식). 네이티브 <dialog> 의 showModal:
// 바깥은 inert, Esc 로 닫힘, 닫으면 여는 버튼으로 포커스가 돌아간다.
// 처음 포커스는 "취소"(먼저 나오는 버튼)라 Enter 를 눌러도 바로 지워지지 않는다
export function DeleteInquiryDialog({
  id,
  name,
  action,
}: DeleteInquiryDialogProps) {
  const t = useTranslations("AdminInquiries.deleteDialog");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const bodyId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={buttonStyles({ variant: "outline" })}
      >
        <Trash2 aria-hidden />
        {t("open")}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="m-auto w-full max-w-md rounded-10 p-7.5 text-white surface-raised backdrop:bg-black/70"
      >
        <form action={action} className="flex flex-col gap-5">
          <input type="hidden" name="id" value={id} />
          <h2 id={titleId} className="text-h4">
            {t("title")}
          </h2>
          <p id={bodyId} className="text-body text-grey-70">
            {t("body", { name })}
          </p>
          <div className="flex flex-wrap justify-end gap-2.5">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className={buttonStyles({ variant: "outline" })}
            >
              {t("cancel")}
            </button>
            <SubmitButton pendingLabel={t("deleting")}>
              {t("confirm")}
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
