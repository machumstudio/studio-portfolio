import { ArrowUpRight } from "lucide-react";
import { useId } from "react";
import { Link } from "@/i18n/navigation";
import { usePriceFormat, type Price } from "@/i18n/use-price-format";
import { buttonStyles } from "./Button";
import { cx } from "./cx";
import { HighlightItem } from "./HighlightItem";

type PriceCardProps = {
  /** 패키지 이름 ("개인 촬영") */
  name: string;
  /** 숫자 가격. 없으면 customPriceLabel ("맞춤 견적") */
  price?: Price;
  customPriceLabel: string;
  /** 포함 항목 */
  features: string[];
  /** 문의 버튼 글자 ("상담 예약"). 카드가 여러 장이라 링크 이름 뒤에 패키지 이름을 숨겨 붙인다 */
  actionLabel: string;
  /** 문의 버튼 목적지 */
  href?: string;
  className?: string;
};

// 가격 패키지 한 줄: 이름 + 가격 + 문의 버튼 | 포함 항목 목록.
// 수치: docs/design/nodes/services-*.json 의 서비스 "Container" > 패키지 "Sub Container" (mobile → lg → 3xl).
// 위 테두리 Dark/12, pad 40/60/80 0. mobile 은 세로(간격 30), lg 부터 가로(간격 80/100, 세로 가운데).
// 왼쪽 칸 폭 -/304/384: 이름 16/16/22 Medium 150% Grey/80 → 가격 줄(가격 34/50/80 Medium 150% Grey/80 + 버튼,
//   세로 가운데, mobile 은 양 끝 / lg 부터 간격 14/20). 맞춤 견적은 34/34/55 Medium 120%.
// 포함 항목은 HighlightItem <ul> (간격 8/8/10). 버튼은 Button link 변형.
// 가격은 <data value> 에 숫자를 두고 화면에는 언어별 짧은 통화 표기.
export function PriceCard({
  name,
  price,
  customPriceLabel,
  features,
  actionLabel,
  href = "/contact",
  className,
}: PriceCardProps) {
  const titleId = useId();
  const formatPrice = usePriceFormat();

  return (
    <article
      aria-labelledby={titleId}
      className={cx(
        "flex flex-col gap-7.5 border-t border-dark-12 py-10 lg:flex-row lg:items-center lg:gap-20 lg:py-15 3xl:gap-25 3xl:py-20",
        className,
      )}
    >
      <div className="flex flex-col lg:w-76 lg:shrink-0 3xl:w-96">
        <h3 id={titleId} className="text-package text-grey-80">
          {name}
        </h3>
        <div className="flex items-center justify-between gap-2.5 lg:justify-start lg:gap-3.5 3xl:gap-5">
          {price ? (
            <data value={price.amount} className="text-price text-grey-80">
              {formatPrice(price)}
            </data>
          ) : (
            <p className="text-quote text-grey-80">{customPriceLabel}</p>
          )}
          <Link href={href} className={buttonStyles({ variant: "link" })}>
            {actionLabel}
            <span className="sr-only">: {name}</span>
            <ArrowUpRight aria-hidden strokeWidth={1.5} />
          </Link>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-2 3xl:gap-2.5">
        {features.map((feature) => (
          <HighlightItem key={feature}>{feature}</HighlightItem>
        ))}
      </ul>
    </article>
  );
}
