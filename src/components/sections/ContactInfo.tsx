import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/Button";

type ContactInfoProps = {
  phone: string;
  email: string;
};

// 연락처 정보. 수치: docs/design/nodes/contact-*.json 의 히어로 다음 "Sub Container" > 첫 "Container".
// 위 테두리 Dark/12, pad 위아래 40/60/80. mobile 세로(간격 40), lg 가로(간격 60/80, 세로 가운데).
//   글 칸: 폭 413/535 (lg), 제목 28/34/44 SemiBold Grey/50 대문자 → 간격 14/24/30 → 본문 14/16/18 Grey/50.
//   링크: mobile 세로(간격 20), lg 가로(간격 40/50). 밑줄 글자 링크(Button link)에서 글자 16/16/18 Medium,
//   아이콘 24 로 바꾼다. 전화는 대문자, 이메일은 입력한 그대로. 이름은 "전화: 값" 처럼 종류를 앞에 붙인다.
// 아래 ContactMessage 와 같은 글 칸 모양이다
export function ContactInfo({ phone, email }: ContactInfoProps) {
  const t = useTranslations("ContactPage.info");
  const link = (className?: string) =>
    buttonStyles({
      variant: "link",
      className: `text-label font-medium [&_svg]:size-6 3xl:[&_svg]:size-6 ${className ?? ""}`,
    });

  return (
    <section
      aria-labelledby="contact-info-title"
      className="flex flex-col gap-10 border-t border-dark-12 py-10 lg:flex-row lg:items-center lg:gap-15 lg:py-15 3xl:gap-20 3xl:py-20"
    >
      <div className="flex flex-col gap-3.5 lg:w-103.25 lg:shrink-0 lg:gap-6 3xl:w-133.75 3xl:gap-7.5">
        <h2
          id="contact-info-title"
          className="text-category text-grey-50 uppercase"
        >
          {t("title")}
        </h2>
        <p className="text-body text-grey-50">{t("body")}</p>
      </div>
      <ul
        aria-label={t("label")}
        className="flex flex-col items-start gap-5 lg:flex-1 lg:flex-row lg:items-center lg:gap-10 3xl:gap-12.5"
      >
        <li>
          <a
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            aria-label={`${t("phone")}: ${phone}`}
            className={link()}
          >
            {phone}
            <ArrowUpRight aria-hidden />
          </a>
        </li>
        <li>
          <a
            href={`mailto:${email}`}
            aria-label={`${t("email")}: ${email}`}
            className={link("normal-case")}
          >
            {email}
            <ArrowUpRight aria-hidden />
          </a>
        </li>
      </ul>
    </section>
  );
}
