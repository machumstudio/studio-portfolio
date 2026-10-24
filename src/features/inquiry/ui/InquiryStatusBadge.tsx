import { useTranslations } from "next-intl";
import { cx } from "@/components/ui/cx";
import type { InquiryStatusType } from "@/domain/inquiry/status";

const tones: Record<InquiryStatusType, string> = {
  New: "bg-purple-55 text-white",
  Read: "bg-dark-20 text-grey-90",
  Done: "border border-dark-30 text-grey-70",
};

// 문의 상태 표시. 색만이 아니라 글자로도 보인다
export function InquiryStatusBadge({ status }: { status: InquiryStatusType }) {
  const t = useTranslations("AdminInquiries.status");
  return (
    <span
      className={cx(
        "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-caption",
        tones[status],
      )}
    >
      {t(status)}
    </span>
  );
}
