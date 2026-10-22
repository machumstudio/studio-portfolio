import { useTranslations } from "next-intl";
import { FaqAccordion, type FaqItem } from "@/components/ui/FaqAccordion";
import { SectionHeading } from "@/components/ui/SectionHeading";

type SiteFaqProps = {
  items: FaqItem[];
  /** 처음에 펼쳐 둘 질문 id. 시안은 각 열에서 하나씩 (1번, 7번) */
  defaultOpen?: string[];
};

// FAQ: Home, Portfolio, Services 공통. 제목(구분선 포함) 아래 lg 부터 2열 아코디언.
// 수치는 SectionHeading, FaqAccordion 주석 참고 (docs/design/nodes/home-*.json 의 FAQ "Container").
export function SiteFaq({ items, defaultOpen }: SiteFaqProps) {
  const t = useTranslations("Faq");

  return (
    <section aria-labelledby="faq-title" className="page-x">
      <SectionHeading
        id="faq-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
      />
      <FaqAccordion
        items={items}
        columns={2}
        multiple
        defaultOpen={defaultOpen}
      />
    </section>
  );
}
