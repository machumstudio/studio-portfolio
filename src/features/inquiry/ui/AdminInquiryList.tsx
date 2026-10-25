import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { buttonStyles } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { inquiryStatusTypes } from "@/application/inquiry/admin-inquiries";
import type { InquiryStatusType } from "@/domain/inquiry/status";
import {
  inquiryDetailHref,
  inquiryListHref,
  type AdminInquiryListView,
  type ListNotice,
} from "../admin-view";
import { useAdminDateTime } from "./inquiry-time";
import { InquiryStatusBadge } from "./InquiryStatusBadge";

type AdminInquiryListProps = {
  list: AdminInquiryListView;
  notice?: ListNotice;
};

// 관리자 문의 목록 (/admin/inquiries): 상태 필터(개수 포함), 최신순 문의, 페이지.
// 필터와 페이지는 주소(?status=&page=)라 JS 없이도 되고, 뒤로 가기와 새로 고침에도 그대로다.
// 데이터는 props 로만 받는다 (서버 컴포넌트에서 그린다)
export function AdminInquiryList({ list, notice }: AdminInquiryListProps) {
  const t = useTranslations("AdminInquiries");
  const formatTime = useAdminDateTime();
  const filters: { status: InquiryStatusType | null; count: number }[] = [
    { status: null, count: list.total },
    ...inquiryStatusTypes.map((status) => ({
      status,
      count: list.counts[status],
    })),
  ];

  return (
    <div className="flex flex-col gap-7.5">
      <div className="flex flex-col gap-2.5">
        <h1 className="text-h3 text-white">{t("list.title")}</h1>
        <p className="max-w-3xl text-body text-grey-70">
          {t("list.description")}
        </p>
      </div>

      <nav aria-label={t("list.filterLabel")}>
        <ul className="flex flex-wrap gap-2.5">
          {filters.map(({ status, count }) => {
            const current = status === list.status;
            return (
              <li key={status ?? "all"}>
                <Link
                  href={inquiryListHref({ status })}
                  aria-current={current ? "page" : undefined}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-label transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-70",
                    current
                      ? "border-purple-55 bg-purple-55 text-white"
                      : "border-dark-20 text-grey-80 hover:border-dark-30 hover:text-white",
                  )}
                >
                  {status ? t(`status.${status}`) : t("list.all")}{" "}
                  <span
                    className={cx(
                      "text-caption",
                      current ? "text-white" : "text-grey-50",
                    )}
                  >
                    {t("list.count", { count })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p role="status" className="text-body text-grey-90 empty:hidden">
        {notice ? t(`notices.${notice}`) : ""}
      </p>

      {list.items.length === 0 ? (
        <p className="rounded-10 border border-dashed border-dark-30 px-5 py-10 text-center text-body text-grey-70">
          {list.status
            ? t("list.emptyFiltered", { status: t(`status.${list.status}`) })
            : t("list.empty")}
        </p>
      ) : (
        <ul aria-label={t("list.label")} className="flex flex-col gap-4">
          {list.items.map((item) => (
            <li
              key={item.id}
              className={cx(
                "relative flex flex-col gap-2.5 rounded-10 border bg-dark-06 p-4 lg:p-5",
                // 카드 전체가 링크라 포커스는 카드 둘레에 보인다. 새 문의의 보라 테두리와 구분되게 바깥 선으로
                "hover:border-dark-30 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-purple-70",
                item.status === "New" ? "border-purple-55" : "border-dark-12",
              )}
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <InquiryStatusBadge status={item.status} />
                <h2 className="mr-auto text-card text-white">
                  {/* 카드 전체가 눌리게 링크 영역을 넓힌다. 읽는 이름은 링크 글자(이름) 하나 */}
                  <Link
                    href={inquiryDetailHref(item.id)}
                    aria-label={t("list.openLabel", { name: item.name })}
                    className="after:absolute after:inset-0 after:rounded-10 focus-visible:outline-none"
                  >
                    {item.name}
                  </Link>
                </h2>
                <p className="text-body text-grey-50">
                  <span className="sr-only">{t("list.receivedAt")} </span>
                  <time dateTime={item.receivedAt.toISOString()}>
                    {formatTime(item.receivedAt)}
                  </time>
                </p>
              </div>
              <p className="text-body break-all text-grey-80">{item.email}</p>
              <p className="line-clamp-2 text-body break-words text-grey-70">
                {item.preview}
              </p>
            </li>
          ))}
        </ul>
      )}

      {list.pageCount > 1 && (
        <nav
          aria-label={t("list.pagination")}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <PageLink
            href={
              list.page > 1
                ? inquiryListHref({ status: list.status, page: list.page - 1 })
                : null
            }
            label={t("list.previous")}
          >
            <ChevronLeft aria-hidden />
          </PageLink>
          <p className="text-body text-grey-80">
            {t("list.pageOf", { page: list.page, pageCount: list.pageCount })}
          </p>
          <PageLink
            href={
              list.page < list.pageCount
                ? inquiryListHref({ status: list.status, page: list.page + 1 })
                : null
            }
            label={t("list.next")}
          >
            <ChevronRight aria-hidden />
          </PageLink>
        </nav>
      )}
    </div>
  );
}

// 첫/마지막 페이지에서는 링크 대신 비활성 표시 (주소 없는 링크는 키보드 순서에서 빠진다)
function PageLink({
  href,
  label,
  children,
}: {
  href: string | null;
  label: string;
  children: ReactNode;
}) {
  const className = buttonStyles({ variant: "icon" });
  return href ? (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  ) : (
    <span aria-hidden className={cx(className, "opacity-40")}>
      {children}
    </span>
  );
}
