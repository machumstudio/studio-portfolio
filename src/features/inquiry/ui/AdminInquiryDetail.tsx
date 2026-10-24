import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { SubmitButton } from "@/components/ui/SubmitButton";
import {
  adminInquiriesPath,
  replyMailto,
  type AdminInquiryDetailView,
  type DetailNotice,
} from "../admin-view";
import { DeleteInquiryDialog } from "./DeleteInquiryDialog";
import { useAdminDateTime } from "./inquiry-time";
import { InquiryStatusBadge } from "./InquiryStatusBadge";

type ServerAction = (formData: FormData) => Promise<void>;

type AdminInquiryDetailProps = {
  inquiry: AdminInquiryDetailView;
  notice?: DetailNotice;
  actions: { changeStatus: ServerAction; remove: ServerAction };
};

// 다른 탭과 부딪혔거나 처리하지 못한 알림은 눈에 띄게
const warning: readonly DetailNotice[] = [
  "conflict",
  "unavailable",
  "malformed",
];

// 관리자 문의 상세 (/admin/inquiries/[id]): 전체 메시지(줄바꿈 그대로), 연락처, 받은 시각과 상태 바뀐 시각,
// 지금 상태에서 할 수 있는 동작 버튼만, 메일 답장, 지우기.
// 화면을 열어도 상태를 바꾸지 않는다: 잘못 눌러 연 문의가 "확인"으로 넘어가 새 문의 목록에서 사라지지 않게 한다.
// 상태 버튼은 일반 폼 POST 라 JS 없이도 된다. 결과는 redirect 된 주소의 notice 로 받는다 (docs/adr/0016)
export function AdminInquiryDetail({
  inquiry,
  notice,
  actions,
}: AdminInquiryDetailProps) {
  const t = useTranslations("AdminInquiries");
  const formatTime = useAdminDateTime();
  const time = (date: Date) => (
    <time dateTime={date.toISOString()}>{formatTime(date)}</time>
  );

  return (
    <article className="flex flex-col gap-7.5">
      <Link
        href={adminInquiriesPath}
        className={buttonStyles({ variant: "link", className: "self-start" })}
      >
        <ArrowLeft aria-hidden />
        {t("detail.back")}
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        <h1 className="text-h3 break-words text-white">
          {t("detail.title", { name: inquiry.name })}
        </h1>
        <InquiryStatusBadge status={inquiry.status} />
      </header>

      <p
        role="status"
        className={cx(
          "rounded-10 px-5 py-4 text-body empty:hidden",
          notice && warning.includes(notice)
            ? "border border-purple-70 text-white"
            : "bg-dark-12 text-grey-90",
        )}
      >
        {notice ? t(`notices.${notice}`) : ""}
      </p>

      <div className="flex flex-col gap-7.5 lg:flex-row lg:items-start">
        <section
          aria-labelledby="inquiry-message"
          className="flex min-w-0 flex-col gap-4 rounded-10 border border-dark-12 bg-dark-08 p-5 lg:flex-2 lg:p-7.5"
        >
          <h2 id="inquiry-message" className="text-h4 text-white">
            {t("detail.message")}
          </h2>
          <p className="text-body break-words whitespace-pre-wrap text-grey-90">
            {inquiry.message}
          </p>
        </section>

        <div className="flex flex-col gap-7.5 lg:flex-1">
          <section
            aria-labelledby="inquiry-contact"
            className="flex flex-col gap-4 rounded-10 border border-dark-12 bg-dark-08 p-5"
          >
            <h2 id="inquiry-contact" className="text-h4 text-white">
              {t("detail.contact")}
            </h2>
            <dl className="flex flex-col gap-3 text-body">
              <div className="flex flex-col gap-1">
                <dt className="text-grey-50">{t("detail.email")}</dt>
                <dd className="break-all text-grey-90">{inquiry.email}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-grey-50">{t("detail.phone")}</dt>
                <dd className="text-grey-90">
                  {inquiry.phone ?? (
                    <span className="text-grey-50">{t("detail.noPhone")}</span>
                  )}
                </dd>
              </div>
            </dl>
            <a
              href={replyMailto(inquiry.email, t("detail.replySubject"))}
              aria-label={t("detail.replyLabel", { name: inquiry.name })}
              className={buttonStyles({ className: "self-start" })}
            >
              <Mail aria-hidden />
              {t("detail.reply")}
            </a>
          </section>

          <section
            aria-labelledby="inquiry-handling"
            className="flex flex-col gap-4 rounded-10 border border-dark-12 bg-dark-08 p-5"
          >
            <h2 id="inquiry-handling" className="text-h4 text-white">
              {t("detail.handling")}
            </h2>
            <dl className="flex flex-col gap-3 text-body">
              <div className="flex flex-col gap-1">
                <dt className="text-grey-50">{t("detail.status")}</dt>
                <dd>
                  <InquiryStatusBadge status={inquiry.status} />
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-grey-50">{t("detail.receivedAt")}</dt>
                <dd className="text-grey-90">{time(inquiry.receivedAt)}</dd>
              </div>
              {inquiry.changedAt && inquiry.status !== "New" && (
                <div className="flex flex-col gap-1">
                  <dt className="text-grey-50">
                    {t(`detail.changedAt.${inquiry.status}`)}
                  </dt>
                  <dd className="text-grey-90">{time(inquiry.changedAt)}</dd>
                </div>
              )}
            </dl>
            {inquiry.actions.map((action) => (
              <form
                key={action}
                action={actions.changeStatus}
                className="flex flex-col gap-2"
              >
                <input type="hidden" name="id" value={inquiry.id} />
                <input type="hidden" name="action" value={action} />
                <SubmitButton
                  variant={action === "reopen" ? "outline" : "primary"}
                  pendingLabel={t("actions.pending")}
                  aria-describedby={`inquiry-hint-${action}`}
                  className="self-start"
                >
                  {t(`actions.${action}`)}
                </SubmitButton>
                <p
                  id={`inquiry-hint-${action}`}
                  className="text-caption text-grey-50"
                >
                  {t(`actions.hints.${action}`)}
                </p>
              </form>
            ))}
            <p className="text-caption text-grey-50">
              {t("detail.noAutoRead")}
            </p>
          </section>

          <div className="self-start">
            {/* 지우기가 실패하면 같은 화면으로 돌아온다(notice=unavailable). 열린 확인 창이 알림을 가리지 않게 새로 만든다 */}
            <DeleteInquiryDialog
              key={notice ?? "none"}
              id={inquiry.id}
              name={inquiry.name}
              action={actions.remove}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
