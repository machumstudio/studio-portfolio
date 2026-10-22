import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

// "Let's Work Together": 모든 페이지 푸터 왼쪽 칸. 바깥 여백과 테두리는 SiteFooter 가 준다.
// 수치: 노드 "Footer > Container > Sub Container" 의 글자 부분.
// 라벨(14/16/20 SemiBold Grey/50) → 간격 20/50/60 → 제목 두 줄(28/48/58 SemiBold, 줄 간격 4/4/10).
// 첫 줄 끝의 보라 알약 버튼(48/56/66)은 문의 페이지 링크.
// 버튼이 제목 사이에 끼어 있어 제목은 sr-only 로 한 번 더 두고, 보이는 두 줄은 보조기기에서 숨긴다.
export function SiteCta() {
  const t = useTranslations("Layout.cta");

  return (
    <div className="flex flex-col gap-5 lg:gap-12.5 3xl:gap-15">
      <p className="text-eyebrow text-grey-50 uppercase">{t("eyebrow")}</p>
      <h2 className="sr-only">{t("title")}</h2>
      <div className="flex flex-col gap-1 text-h1 text-white uppercase 3xl:gap-2.5">
        <div className="flex items-center gap-2.5">
          <span aria-hidden>{t("lead")}</span>
          <Link
            href="/contact"
            aria-label={t("action")}
            className={buttonStyles()}
          >
            <ArrowUpRight />
          </Link>
        </div>
        <span aria-hidden>{t("rest")}</span>
      </div>
    </div>
  );
}
