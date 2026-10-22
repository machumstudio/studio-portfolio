import { useTranslations } from "next-intl";

// Tailwind 가 클래스를 찾을 수 있도록 전체 클래스명을 그대로 적는다.
export const colorTokens = [
  { name: "white", className: "bg-white" },
  { name: "black", className: "bg-black" },
  { name: "purple-55", className: "bg-purple-55" },
  { name: "purple-60", className: "bg-purple-60" },
  { name: "purple-70", className: "bg-purple-70" },
  { name: "purple-80", className: "bg-purple-80" },
  { name: "purple-90", className: "bg-purple-90" },
  { name: "purple-95", className: "bg-purple-95" },
  { name: "purple-97", className: "bg-purple-97" },
  { name: "purple-99", className: "bg-purple-99" },
  { name: "dark-03", className: "bg-dark-03" },
  { name: "dark-06", className: "bg-dark-06" },
  { name: "dark-08", className: "bg-dark-08" },
  { name: "dark-12", className: "bg-dark-12" },
  { name: "dark-15", className: "bg-dark-15" },
  { name: "dark-20", className: "bg-dark-20" },
  { name: "dark-25", className: "bg-dark-25" },
  { name: "dark-30", className: "bg-dark-30" },
  { name: "grey-40", className: "bg-grey-40" },
  { name: "grey-50", className: "bg-grey-50" },
  { name: "grey-70", className: "bg-grey-70" },
  { name: "grey-80", className: "bg-grey-80" },
  { name: "grey-90", className: "bg-grey-90" },
  { name: "grey-95", className: "bg-grey-95" },
  { name: "grey-97", className: "bg-grey-97" },
  { name: "grey-99", className: "bg-grey-99" },
  { name: "star", className: "bg-star" },
] as const;

export const typeTokens = [
  { name: "display", className: "text-display" },
  { name: "price", className: "text-price" },
  { name: "h1", className: "text-h1" },
  { name: "h2", className: "text-h2" },
  { name: "h3", className: "text-h3" },
  { name: "h4", className: "text-h4" },
  { name: "title", className: "text-title" },
  { name: "tagline", className: "text-tagline" },
  { name: "lead", className: "text-lead" },
  { name: "body", className: "text-body" },
  { name: "eyebrow", className: "text-eyebrow" },
  { name: "button", className: "text-button" },
  { name: "field", className: "text-field" },
  { name: "label", className: "text-label" },
  { name: "caption", className: "text-caption" },
  { name: "logo", className: "text-logo" },
  { name: "wordmark", className: "text-wordmark" },
] as const;

export function TokenSheet() {
  const t = useTranslations("Tokens");

  return (
    <div className="flex flex-col gap-16 page-x py-16">
      <header className="flex flex-col gap-4">
        <h1 className="text-h1">{t("title")}</h1>
        <p className="text-body text-grey-70">{t("intro")}</p>
      </header>

      <section aria-labelledby="colors" className="flex flex-col gap-6">
        <h2 id="colors" className="text-h2">
          {t("colors", { count: colorTokens.length })}
        </h2>
        <ul className="grid grid-cols-3 gap-5 md:grid-cols-6 lg:grid-cols-9">
          {colorTokens.map((color) => (
            <li key={color.name} className="flex flex-col gap-2">
              <span
                aria-hidden
                className={`${color.className} aspect-square rounded-xl border border-dark-20`}
              />
              <code className="text-body text-grey-70">{color.name}</code>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="typography" className="flex flex-col gap-6">
        <h2 id="typography" className="text-h2">
          {t("typography")}
        </h2>
        <ul className="flex flex-col gap-8">
          {typeTokens.map((type) => (
            <li
              key={type.name}
              className="flex flex-col gap-2 border-b border-dark-15 pb-8"
            >
              <code className="text-body text-purple-90">{type.className}</code>
              <p className={type.className}>{t("sample")}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
