import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Link } from "@/i18n/navigation";

// 404: 없는 주소, 없는/비공개 작업 (/work/[slug] 의 notFound()). 사이트 틀(헤더, CTA 푸터) 안에 나온다.
// 시안에 없는 화면이라 기존 조각만 쓴다: SectionHeading(h1, 라벨 404) + 본문(text-body Grey/50)
// + primary "홈으로" / outline "작업 둘러보기". 간격은 Portfolio 히어로(헤더 아래 40/80/100, 글 간격 24/31)를 따른다.
// 하위 not-found 는 metadata 를 내보낼 수 없고 404 응답에는 <title> 이 빠져서, React 19 <title> 로 직접 넣는다.
export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <div className="flex flex-col items-start gap-6 page-x pt-10 pb-20 lg:pt-20 lg:pb-37.5 3xl:gap-7.75 3xl:pt-25 3xl:pb-50">
      <title>{t("metadata")}</title>
      <SectionHeading
        as="h1"
        className="self-stretch"
        eyebrow={t("eyebrow")}
        title={t("title")}
      />
      <p className="text-body text-grey-50">{t("body")}</p>
      <div className="mt-4 flex flex-wrap gap-5 3xl:mt-5 3xl:gap-7.5">
        <Link href="/" className={buttonStyles()}>
          {t("home")}
        </Link>
        <Link
          href="/portfolio"
          className={buttonStyles({ variant: "outline" })}
        >
          {t("portfolio")}
        </Link>
      </div>
    </div>
  );
}
