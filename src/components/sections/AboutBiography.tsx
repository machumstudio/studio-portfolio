import { useTranslations } from "next-intl";

type AboutBiographyProps = {
  /** 문단들. 시안은 한 덩어리 글에 줄바꿈만 있어 문단 사이 간격이 없다 */
  paragraphs: string[];
};

// About 페이지 "우리의 이야기". 수치: docs/design/nodes/about-*.json 첫 "Container" 의 Biography "Text Container".
// 위아래 테두리 Dark/12, pad 40/60/80 0 (테두리 inside 라 1px 뺌), 제목-본문 간격 20/30/40.
// 제목 24/34/44 SemiBold Grey/50(흰색 아님), 본문 14/16/20 Regular 150% Grey/50.
export function AboutBiography({ paragraphs }: AboutBiographyProps) {
  const t = useTranslations("AboutPage.biography");

  return (
    <section aria-labelledby="about-biography-title" className="page-x">
      <div className="flex flex-col gap-5 border-y border-dark-12 py-9.75 lg:gap-7.5 lg:py-14.75 3xl:gap-10 3xl:py-19.75">
        <h2
          id="about-biography-title"
          className="text-h2 text-grey-50 uppercase"
        >
          {t("title")}
        </h2>
        <div className="text-prose text-grey-50">
          {paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
