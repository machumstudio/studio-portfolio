"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { buttonStyles } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Link } from "@/i18n/navigation";

// 공개 화면의 예기치 못한 오류 (작업 저장소 장애 등). 사이트 틀(헤더, CTA 푸터)은 그대로 두고 본문만 바꾼다.
// 404 화면(not-found.tsx)과 같은 조각: SectionHeading(h1, 라벨 "오류") + 본문 + primary "다시 시도" / outline "홈으로".
// 서버 오류의 자세한 내용은 화면에 보이지 않는다 (운영 빌드는 digest 만 온다). 원인은 서버 로그에서 digest 로 찾는다
export default function SiteError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const t = useTranslations("ErrorPage");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main"
      className="flex flex-col items-start gap-6 page-x pt-10 pb-20 lg:pt-20 lg:pb-37.5 3xl:gap-7.75 3xl:pt-25 3xl:pb-50"
    >
      <title>{t("metadata")}</title>
      <SectionHeading
        as="h1"
        className="self-stretch"
        eyebrow={t("eyebrow")}
        title={t("title")}
      />
      <p className="text-body text-grey-50">{t("body")}</p>
      <div className="mt-4 flex flex-wrap gap-5 3xl:mt-5 3xl:gap-7.5">
        <button
          type="button"
          onClick={() => retry()}
          className={buttonStyles()}
        >
          {t("retry")}
        </button>
        <Link href="/" className={buttonStyles({ variant: "outline" })}>
          {t("home")}
        </Link>
      </div>
    </main>
  );
}
