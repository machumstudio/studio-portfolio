import { ExternalLink, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { useYearMonthFormat } from "@/i18n/use-year-month-format";

export type AdminWorkRow = {
  id: string;
  slug: string;
  titleKo: string;
  titleEn: string;
  /** YYYY-MM */
  date: string;
  published: boolean;
  cover: { src: string; alt: string };
  photoCount: number;
};

type AdminWorkListProps = {
  works: readonly AdminWorkRow[];
  /** 방금 작업을 지우고 왔을 때 */
  notice?: "deleted";
};

// 관리자 작업 목록 (/admin): 대표 사진, 제목(한국어/영어), 공개 여부, 촬영 연월, 사진 장수.
// 작업마다 제목(h2)과 "고치기" 링크, 공개 작업은 공개 화면 링크(새 탭)를 둔다.
// 공개 여부는 색만이 아니라 글자로도 보인다. 데이터는 props 로만 받는다 (서버 컴포넌트에서도 그린다)
export function AdminWorkList({ works, notice }: AdminWorkListProps) {
  const t = useTranslations("AdminWorks.list");
  const formatYearMonth = useYearMonthFormat();

  return (
    <div className="flex flex-col gap-7.5">
      <div className="flex flex-wrap items-end gap-5">
        <div className="mr-auto flex flex-col gap-2.5">
          <h1 className="text-h3 text-white">{t("title")}</h1>
          <p className="text-body text-grey-70">{t("description")}</p>
        </div>
        <Link href="/admin/works/new" className={buttonStyles()}>
          <Plus aria-hidden />
          {t("create")}
        </Link>
      </div>

      <p role="status" className="text-body text-grey-90 empty:hidden">
        {notice === "deleted" ? t("deleted") : ""}
      </p>

      {works.length === 0 ? (
        <p className="rounded-10 border border-dashed border-dark-30 px-5 py-10 text-center text-body text-grey-70">
          {t("empty")}
        </p>
      ) : (
        <ul aria-label={t("label")} className="flex flex-col gap-4">
          {works.map((work) => (
            <li
              key={work.id}
              className="grid grid-cols-3 items-center gap-4 rounded-10 border border-dark-12 bg-dark-06 p-4 md:grid-cols-6 lg:p-5"
            >
              <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-dark-15">
                <Image
                  src={work.cover.src}
                  alt={work.cover.alt}
                  fill
                  sizes="(min-width: 768px) 160px, 30vw"
                  className="object-cover"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-2 md:col-span-3">
                <h2 className="text-card text-white">{work.titleKo}</h2>
                <p className="text-body text-grey-50">{work.titleEn}</p>
                <p className="flex flex-wrap items-center gap-2.5 text-body text-grey-70">
                  <span
                    className={cx(
                      "rounded-full px-2.5 py-0.5 text-caption",
                      work.published
                        ? "bg-purple-55 text-white"
                        : "bg-dark-20 text-grey-80",
                    )}
                  >
                    {work.published ? t("published") : t("private")}
                  </span>
                  <span>{formatYearMonth(work.date)}</span>
                  <span aria-hidden>·</span>
                  <span>{t("photoCount", { count: work.photoCount })}</span>
                </p>
              </div>
              <div className="col-span-3 flex flex-wrap gap-2.5 md:col-span-2 md:justify-end">
                <Link
                  href={`/admin/works/${work.id}`}
                  aria-label={t("editLabel", { title: work.titleKo })}
                  className={buttonStyles({ variant: "outline" })}
                >
                  {t("edit")}
                </Link>
                {work.published && (
                  <a
                    href={`/work/${work.slug}`}
                    target="_blank"
                    rel="noopener"
                    aria-label={t("viewLabel", { title: work.titleKo })}
                    className={buttonStyles({ variant: "outline" })}
                  >
                    {t("view")}
                    <ExternalLink aria-hidden />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
