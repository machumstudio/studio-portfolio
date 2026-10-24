import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

type ContactMessageProps = {
  /** 문의 폼. 섹션은 기능을 모르므로 페이지가 features/inquiry 의 InquiryForm 을 넣는다 */
  form: ReactNode;
};

// 메시지 보내기. 수치: docs/design/nodes/contact-*.json 의 히어로 다음 "Sub Container" > 둘째 "Container".
// 위 테두리 Dark/12, pad 위 40/60/80 아래 0/60/80. mobile 세로(간격 40), lg 가로(간격 60/80, 위 정렬).
// 글 칸은 ContactInfo 와 같다 (폭 413/535, 제목 → 간격 14/24/30 → 본문). 폼은 남은 폭 807/981
export function ContactMessage({ form }: ContactMessageProps) {
  const t = useTranslations("ContactPage.message");

  return (
    <section
      id="message"
      aria-labelledby="contact-message-title"
      className="flex scroll-mt-10 flex-col gap-10 border-t border-dark-12 pt-10 lg:flex-row lg:gap-15 lg:py-15 3xl:gap-20 3xl:py-20"
    >
      <div className="flex flex-col gap-3.5 lg:w-103.25 lg:shrink-0 lg:gap-6 3xl:w-133.75 3xl:gap-7.5">
        <h2
          id="contact-message-title"
          className="text-category text-grey-50 uppercase"
        >
          {t("title")}
        </h2>
        <p className="text-body text-grey-50">{t("body")}</p>
      </div>
      <div className="lg:min-w-0 lg:flex-1">{form}</div>
    </section>
  );
}
