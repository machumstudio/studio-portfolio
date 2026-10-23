import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { Link } from "@/i18n/navigation";

type PagerWork = { slug: string; title: string };

type WorkPagerProps = {
  previous: PagerWork | null;
  next: PagerWork | null;
};

// 작업 상세 아래 이전/다음 작업 링크. 시안에 없는 UI 라 기존 조각을 조합한다:
// surface-raised 상자(outline 버튼 표면) + 원형 화살표(Button icon lg 모양) + 라벨(text-eyebrow Grey/50) + 제목(text-h3).
// md 부터 2열, 다음은 늘 오른쪽 칸. 처음/끝 작업이면 그쪽 링크가 없다.
export function WorkPager({ previous, next }: WorkPagerProps) {
  const t = useTranslations("WorkPage.pager");
  if (!previous && !next) return null;

  const item = (work: PagerWork, direction: "previous" | "next") => {
    const Icon = direction === "previous" ? ArrowLeft : ArrowRight;
    return (
      <Link
        href={`/work/${work.slug}`}
        rel={direction === "previous" ? "prev" : "next"}
        className={cx(
          "group flex items-center gap-5 rounded-2xl p-5 transition-colors surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-70 lg:p-7.5 3xl:gap-7.5 3xl:rounded-20 3xl:p-10",
          direction === "next" && "flex-row-reverse text-right md:col-start-2",
        )}
      >
        <span
          aria-hidden
          className={buttonStyles({
            variant: "icon",
            size: "lg",
            className: "group-hover:text-purple-80",
          })}
        >
          <Icon />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 3xl:gap-1">
          <span className="text-eyebrow text-grey-50 uppercase">
            {t(direction)}
          </span>
          <span className="text-h3 text-white">{work.title}</span>
        </span>
      </Link>
    );
  };

  return (
    <nav
      aria-label={t("label")}
      className="grid gap-5 page-x md:grid-cols-2 lg:gap-10 3xl:gap-12.5"
    >
      {previous && item(previous, "previous")}
      {next && item(next, "next")}
    </nav>
  );
}
