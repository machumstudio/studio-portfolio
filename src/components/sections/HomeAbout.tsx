import { ArrowRight, Sparkle } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { siFacebook, siInstagram, siX } from "simple-icons";
import { Button, buttonStyles } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Link } from "@/i18n/navigation";

// 시안은 Facebook, Twitter, LinkedIn 이지만 LinkedIn 은 simple-icons 에서 빠졌다.
// 푸터, 후기와 같은 세 서비스로 맞춘다. 가상 스튜디오라 각 서비스 첫 화면으로 둔다
const socials = [
  { key: "instagram", href: "https://www.instagram.com/", icon: siInstagram },
  { key: "facebook", href: "https://www.facebook.com/", icon: siFacebook },
  { key: "x", href: "https://x.com/", icon: siX },
] as const;

// 카드 소제목: 보라 별(23/29/39) + 글자 20/24/30 Medium Grey/80, 간격 4/6/10, 아래 정렬
function CardTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3
      id={id}
      className="flex items-end gap-1 text-title text-grey-80 lg:gap-1.5 3xl:gap-2.5"
    >
      <Sparkle
        aria-hidden
        className="size-6 shrink-0 fill-purple-80 text-purple-80 lg:size-7.5 3xl:size-10"
        strokeWidth={1}
      />
      {children}
    </h3>
  );
}

// 아래 줄 버튼 두 개: 남는 폭 반반 + 시안 패딩
const ctaClass = "px-5.75 lg:flex-1 3xl:px-8.25 3xl:py-4.25";

type HomeAboutProps = {
  photo: { src: string; alt: string };
  email: string;
  phone: string;
};

// 수치: docs/design/nodes/home-*.json 의 Hero 다음 "Container" (mobile → lg → 3xl).
// 제목: SectionHeading(divider) + "Know More" outline 버튼. 제목-본문 간격 40/60/80.
// 본문: mobile 세로(사진 358x375 → 카드, 간격 20), lg 부터 반반 가로(간격 20/30, 세로 가운데),
//   사진 높이 585/710. 태블릿(시안 없음)은 md 부터 반반, 사진은 카드 높이에 맞춘다.
// 카드: 테두리 Dark/12, radius 16/20/20. 두 칸 pad 24/30/40, 사이 테두리.
//   소개 칸: 소제목-본문 간격 12/16/20, 본문 14/16/18 Regular 150% Grey/70.
//   연락처 칸: 간격 20/30/40. 항목은 mobile 세로(간격 12), lg 가로 2열(간격 16/20).
//     항목 라벨 14/16/18 Medium Grey/90 → 간격 2/6/10 → 값 16/18/20 Regular Grey/70.
//   아래 줄: mobile 세로 왼쪽 정렬(간격 20, 버튼 2개 세로 간격 16, 가득), lg 가로(간격 50/60, 버튼 간격 16/20, 남는 폭 반반).
//     소셜 묶음 Dark/03 + 테두리 Dark/12 알약 pad 8/10 간격 10/16, 버튼 40/40/48 (아이콘 16/16/20).
//     소셜 버튼 40/40/48 (아이콘 16/16/20). Button icon md(38/38/48) 위에 크기만 덮어쓴다.
//     버튼 outline 49/49/63 (pad 14 24 / 14 24 / 18 34, 테두리 inside 라 1px 뺌). Button outline 위에 패딩만 덮어쓴다.
export function HomeAbout({ photo, email, phone }: HomeAboutProps) {
  const t = useTranslations("About");
  const social = useTranslations("Layout.footer");

  return (
    <section
      aria-labelledby="about-title"
      className="flex flex-col gap-10 page-x lg:gap-15 3xl:gap-20"
    >
      <SectionHeading
        id="about-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        actions={
          <Link href="/about" className={buttonStyles({ variant: "outline" })}>
            {t("more")}
            <ArrowRight aria-hidden />
          </Link>
        }
      />

      <div className="flex flex-col gap-5 md:flex-row md:items-stretch lg:items-center 3xl:gap-7.5">
        <div
          data-visual-mask
          className="relative h-93.75 shrink-0 overflow-hidden rounded-2xl bg-dark-15 md:h-auto md:flex-1 lg:h-146.25 lg:rounded-20 3xl:h-177.5"
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col rounded-2xl border border-dark-12 md:flex-1 lg:rounded-20">
          <section
            aria-labelledby="about-intro"
            className="flex flex-col gap-3 border-b border-dark-12 p-6 lg:gap-4 lg:p-7.5 3xl:gap-5 3xl:p-10"
          >
            <CardTitle id="about-intro">{t("intro.title")}</CardTitle>
            <p className="text-body text-grey-70">{t("intro.body")}</p>
          </section>

          <section
            aria-labelledby="about-contact"
            className="flex flex-col gap-5 p-6 lg:gap-7.5 lg:p-7.5 3xl:gap-10 3xl:p-10"
          >
            <CardTitle id="about-contact">{t("contact.title")}</CardTitle>
            <dl className="flex flex-col gap-3 lg:flex-row lg:gap-4 3xl:gap-5">
              {[
                { key: "email", value: email, href: `mailto:${email}` },
                { key: "phone", value: phone, href: `tel:${phone}` },
              ].map(({ key, value, href }) => (
                <div
                  key={key}
                  className="flex flex-col gap-0.5 lg:flex-1 lg:gap-1.5 3xl:gap-2.5"
                >
                  <dt className="text-body font-medium text-grey-90">
                    {t(`contact.${key}`)}
                  </dt>
                  <dd>
                    <a
                      href={href}
                      className="text-lead font-normal text-grey-70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-70"
                    >
                      {value}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-col items-start gap-5 lg:flex-row lg:items-center lg:gap-12.5 3xl:gap-15">
              <ul
                aria-label={social("social.label")}
                className="flex gap-2.5 rounded-full border border-dark-12 bg-dark-03 p-1.75 3xl:gap-4 3xl:p-2.25"
              >
                {socials.map(({ key, href, icon }) => (
                  <li key={key}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${social(`social.${key}`)} (${social("newTab")})`}
                      className={buttonStyles({
                        variant: "icon",
                        size: "md",
                        className: "size-10 [&_svg]:size-4",
                      })}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d={icon.path} />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
              <div className="flex w-full flex-col gap-4 lg:flex-row 3xl:gap-5">
                <Link
                  href="/contact"
                  className={buttonStyles({
                    variant: "outline",
                    className: ctaClass,
                  })}
                >
                  {t("work")}
                </Link>
                {/* TODO(소개서 PDF): 내려받을 파일이 아직 없어 비활성으로 둔다.
                    href="#" 링크는 눌러도 맨 위로 튀기만 하고 키보드/보조기기에는 동작하는 링크로 보여 혼란을 준다.
                    파일이 생기면 <a href download> 로 바꾸고 "준비 중" 표시를 뺀다 */}
                <Button variant="outline" disabled className={ctaClass}>
                  {t("cv")}
                  <span className="sr-only"> ({t("cvPending")})</span>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
