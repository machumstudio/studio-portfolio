import { createFormatter } from "next-intl";
import { describe, expect, it } from "vitest";
import { formatPrice } from "./use-price-format";

const ko = createFormatter({ locale: "ko" });
const en = createFormatter({ locale: "en" });

describe("formatPrice", () => {
  it("ko 는 만 단위로 줄여 쓴다", () => {
    expect(formatPrice(ko, { amount: 250_000, currency: "KRW" })).toBe("₩25만");
    expect(formatPrice(ko, { amount: 1_500_000, currency: "KRW" })).toBe(
      "₩150만",
    );
  });

  it("en 은 같은 원화 금액을 K/M 으로 줄여 쓴다", () => {
    expect(formatPrice(en, { amount: 250_000, currency: "KRW" })).toBe("₩250K");
    expect(formatPrice(en, { amount: 1_500_000, currency: "KRW" })).toBe(
      "₩1.5M",
    );
  });

  it("통화는 값을 따른다", () => {
    expect(formatPrice(en, { amount: 250, currency: "USD" })).toBe("$250");
  });
});
