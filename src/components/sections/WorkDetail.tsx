import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/Button";
import { Gallery } from "@/components/ui/Gallery";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Link } from "@/i18n/navigation";
import { useYearMonthFormat } from "@/i18n/use-year-month-format";

type Photo = { src: string; alt: string };

type WorkDetailProps = {
  title: string;
  /** Works.categories.<id> 메시지 키 */
  category: string;
  /** 촬영 연월 "YYYY-MM" */
  date: string;
  cover: Photo;
  /** 순서대로 정렬된 전체 사진 (대표 사진 포함) */
  images: Photo[];
};

// 작업 상세 (/work/[slug]). 시안에 없는 화면이라 기존 조각만 조합한다:
// 위: outline 버튼("포트폴리오로") → SectionHeading(h1, 라벨=카테고리, 오른쪽=촬영 연월, 아래 구분선)
// 가운데: 대표 사진. Portfolio 히어로 사진과 같은 크기(mobile 19:10 radius 14, lg 716/784 radius 34)
// 아래: "사진 n장" 제목(갤러리 묶음 제목과 같은 text-category Grey/50) + Gallery(썸네일 → Lightbox)
// 블록 간격 40/60/80, 제목-썸네일 20/40/50 (Portfolio 갤러리 간격).
export function WorkDetail({
  title,
  category,
  date,
  cover,
  images,
}: WorkDetailProps) {
  const t = useTranslations("WorkPage");
  const categories = useTranslations("Works.categories");
  const formatYearMonth = useYearMonthFormat();
  const total = images.length;

  return (
    <article
      aria-labelledby="work-title"
      className="flex flex-col gap-10 page-x lg:gap-15 3xl:gap-20"
    >
      <header className="flex flex-col items-start gap-5 lg:gap-10 3xl:gap-12.5">
        <Link
          href="/portfolio"
          className={buttonStyles({ variant: "outline" })}
        >
          <ArrowLeft aria-hidden />
          {t("back")}
        </Link>
        <SectionHeading
          as="h1"
          id="work-title"
          className="self-stretch"
          eyebrow={categories(`${category}.name`)}
          title={title}
          actions={
            <time dateTime={date} className="text-lead text-grey-70">
              {formatYearMonth(date)}
            </time>
          }
        />
      </header>

      <div
        data-visual-mask
        className="relative aspect-19/10 overflow-hidden rounded-14 bg-dark-15 lg:aspect-auto lg:h-179 lg:rounded-34 3xl:h-196"
      >
        <Image
          src={cover.src}
          alt={cover.alt}
          fill
          preload
          sizes="(min-width: 1024px) 90vw, 100vw"
          className="object-cover"
        />
      </div>

      <section
        aria-labelledby="work-gallery-title"
        className="flex flex-col gap-5 lg:gap-10 3xl:gap-12.5"
      >
        <h2
          id="work-gallery-title"
          className="text-category text-grey-50 uppercase"
        >
          {t("gallery", { count: total })}
        </h2>
        <Gallery
          images={images}
          openLabels={images.map(
            ({ alt }, i) =>
              t("open", { index: i + 1 }) + (alt ? `: ${alt}` : ""),
          )}
          lightbox={{
            label: t("lightbox.label", { title }),
            closeLabel: t("lightbox.close"),
            previousLabel: t("lightbox.previous"),
            nextLabel: t("lightbox.next"),
            positionLabels: images.map((_, i) =>
              t("lightbox.position", { index: i + 1, total }),
            ),
          }}
        />
      </section>
    </article>
  );
}
