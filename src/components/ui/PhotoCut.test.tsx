import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PhotoCutFooter } from "./PhotoCut";

describe("PhotoCutFooter", () => {
  it("안내 글만 읽히고 별 원, 모서리 조각, 사진 마스크는 보조기기에서 숨긴다", () => {
    const { container } = render(
      <PhotoCutFooter scrollLabel="아래로 내려 보기" />,
    );
    expect(screen.getByText("아래로 내려 보기")).toBeInTheDocument();
    const masks = container.querySelectorAll("[data-visual-mask]");
    expect(masks).toHaveLength(1);
    for (const el of container.querySelectorAll("span")) {
      expect(el.closest("[aria-hidden]")).not.toBeNull();
    }
  });
});
