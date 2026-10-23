import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/ko.json";
import { AboutHero } from "./AboutHero";

const stats = [
  { id: "years", value: "15+", label: "촬영 경력(년)" },
  { id: "clients", value: "500+", label: "함께한 고객" },
];

const renderHero = () =>
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <AboutHero
        image={{ src: "/images/placeholder.svg", alt: "" }}
        stats={stats}
      />
    </NextIntlClientProvider>,
  );

describe("AboutHero", () => {
  it("제목이 페이지 h1 이고 섹션 이름이 된다", () => {
    renderHero();
    const h1 = screen.getByRole("heading", {
      level: 1,
      name: "마춤 스튜디오 소개",
    });
    expect(screen.getByRole("region", { name: "마춤 스튜디오 소개" })).toBe(
      h1.closest("section"),
    );
  });

  it("통계는 <dl> 의 설명(dt) - 숫자(dd) 쌍이다", () => {
    const { container } = renderHero();
    const dl = container.querySelector("dl");
    expect(dl).not.toBeNull();
    const terms = within(dl!).getAllByRole("term");
    const values = within(dl!).getAllByRole("definition");
    expect(terms.map((el) => el.textContent)).toEqual([
      "촬영 경력(년)",
      "함께한 고객",
    ]);
    expect(values.map((el) => el.textContent)).toEqual(["15+", "500+"]);
    // 같은 묶음 안에서 설명 다음에 숫자 (보이는 순서는 CSS 로 뒤집는다)
    expect(terms[0].nextElementSibling).toBe(values[0]);
  });

  it("꾸밈 조각과 사진 마스크는 보조기기에서 숨긴다", () => {
    const { container } = renderHero();
    const masks = container.querySelectorAll("[data-visual-mask]");
    // mobile 사진 하나 + lg 사진이 보이는 사각형 넷(위 오른쪽, 띠 아래 계단, 가운데, 아래 줄 가운데)
    expect(masks).toHaveLength(5);
    for (const mask of masks) {
      expect(mask).toHaveAttribute("aria-hidden");
    }
  });
});
