import { describe, expect, it } from "vitest";
import { cx } from "./cx";

describe("cx", () => {
  it("거짓 값은 버리고 공백 하나로 잇는다", () => {
    expect(cx("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("겹치는 Tailwind 클래스는 뒤쪽이 이긴다 (반응형 접두사별로)", () => {
    expect(cx("px-4 py-2", "px-6")).toBe("py-2 px-6");
    expect(cx("size-9.5 3xl:size-12", "size-10")).toBe("3xl:size-12 size-10");
    expect(cx("[&_svg]:size-4.5", "[&_svg]:size-4")).toBe("[&_svg]:size-4");
    expect(cx("lg:px-4.25", "px-3.25")).toBe("lg:px-4.25 px-3.25");
  });

  it("테마 색 토큰끼리 겹치면 뒤쪽 색만 남는다", () => {
    expect(cx("bg-purple-55 text-white", "bg-dark-12")).toBe(
      "text-white bg-dark-12",
    );
    expect(cx("text-grey-70", "text-white")).toBe("text-white");
  });

  describe("커스텀 글자 유틸리티 (globals.css @utility text-*)", () => {
    it.each([
      "text-display",
      "text-price",
      "text-h1",
      "text-h2",
      "text-h3",
      "text-h4",
      "text-title",
      "text-category",
      "text-package",
      "text-quote",
      "text-send",
      "text-tagline",
      "text-lead",
      "text-body",
      "text-eyebrow",
      "text-button",
      "text-field",
      "text-label",
      "text-caption",
      "text-logo",
      "text-wordmark",
    ])("%s 는 글자 색과 따로 산다", (size) => {
      expect(cx(size, "text-grey-70")).toBe(`${size} text-grey-70`);
      expect(cx("text-grey-70", size)).toBe(`text-grey-70 ${size}`);
    });

    it("글자 유틸리티끼리, 그리고 기본 글자 크기와는 뒤쪽이 이긴다", () => {
      expect(cx("text-body", "text-h1")).toBe("text-h1");
      expect(cx("text-sm", "text-body")).toBe("text-body");
      expect(cx("text-body", "lg:text-lead")).toBe("text-body lg:text-lead");
    });

    it("굵기는 그대로 두고, 앞의 행간은 글자 유틸리티가 덮는다", () => {
      expect(cx("text-body font-medium")).toBe("text-body font-medium");
      expect(cx("text-body leading-normal")).toBe("text-body leading-normal");
      expect(cx("leading-normal", "text-body")).toBe("text-body");
    });
  });

  it("page-x 와 좌우 padding 은 뒤쪽이 이긴다", () => {
    expect(cx("px-4", "page-x")).toBe("page-x");
    expect(cx("page-x", "px-0")).toBe("px-0");
    expect(cx("page-x", "p-0")).toBe("p-0");
    expect(cx("pl-2", "page-x")).toBe("page-x");
    // 위아래 padding 은 다른 속성이라 남는다
    expect(cx("page-x py-10", "lg:page-x")).toBe("page-x py-10 lg:page-x");
  });

  it("surface-raised 는 테두리/배경 클래스에 지워지지 않는다", () => {
    expect(cx("surface-raised rounded-full", "border-dark-12 bg-dark-03")).toBe(
      "surface-raised rounded-full border-dark-12 bg-dark-03",
    );
    expect(cx("surface-raised", "surface-raised")).toBe("surface-raised");
  });

  it("시안 radius 토큰(10, 20, 30, 100)도 radius 로 병합된다", () => {
    expect(cx("rounded-lg", "rounded-10")).toBe("rounded-10");
    expect(cx("rounded-bl-30", "rounded-bl-100")).toBe("rounded-bl-100");
    expect(cx("rounded-20", "lg:rounded-2xl", "rounded-xl")).toBe(
      "lg:rounded-2xl rounded-xl",
    );
    expect(cx("rounded-34", "rounded-photo-cut")).toBe("rounded-photo-cut");
    expect(cx("rounded-tr-photo-cut", "rounded-tr-24")).toBe("rounded-tr-24");
  });
});
