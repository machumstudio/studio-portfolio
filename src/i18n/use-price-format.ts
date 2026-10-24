import { useFormatter, type createFormatter } from "next-intl";

type Formatter = ReturnType<typeof createFormatter>;

export type Price = {
  /** 통화의 기본 단위 금액 (원화면 원) */
  amount: number;
  /** ISO 4217 통화 코드 ("KRW") */
  currency: string;
};

// 패키지 가격을 언어별 짧은 표기로 ("₩25만", "₩250K").
// 통화는 값에 붙어 다니고 표시 언어로 바꾸지 않는다 (같은 패키지는 언어와 상관없이 같은 가격).
// 가격 칸이 좁아(시안 가격 + 버튼 한 줄 304/384) compact 표기를 쓴다
export const formatPrice = (format: Formatter, { amount, currency }: Price) =>
  format.number(amount, {
    style: "currency",
    currency,
    notation: "compact",
  });

export function usePriceFormat() {
  const format = useFormatter();
  return (price: Price) => formatPrice(format, price);
}
