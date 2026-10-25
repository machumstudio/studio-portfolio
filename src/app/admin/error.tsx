"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { buttonStyles } from "@/components/ui/Button";

// 관리자 화면의 예기치 못한 오류 (저장소 장애 등). 관리자 루트 레이아웃 안에서 한국어로 그린다 (docs/adr/0013).
// 문의 상태 바꾸기, 작업 저장 같은 쓰기는 이미 자기 화면에서 "지금은 처리할 수 없습니다"로 알려 주고, 여기는 읽기가 실패한 경우다
export default function AdminError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const t = useTranslations("AdminErrors.error");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center page-x py-20">
      <title>{t("metadata")}</title>
      <div className="flex max-w-md flex-col items-start gap-5">
        <h1 className="text-h3 text-white">{t("title")}</h1>
        <p className="text-body text-grey-70">{t("body")}</p>
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => retry()}
            className={buttonStyles()}
          >
            {t("retry")}
          </button>
          <Link href="/admin" className={buttonStyles({ variant: "outline" })}>
            {t("works")}
          </Link>
        </div>
      </div>
    </main>
  );
}
