import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/ko.json";
import { colorTokens, TokenSheet, typeTokens } from "./token-sheet";

const tokensCss = readFileSync("docs/design/tokens.css", "utf8");

describe("TokenSheet", () => {
  it("tokens.css 의 색 토큰을 빠짐없이 보여준다", () => {
    const cssColors = [...tokensCss.matchAll(/--color-([\w-]+):/g)].map(
      (m) => m[1],
    );
    expect(cssColors).toHaveLength(26);
    expect(colorTokens.map((c) => c.name)).toEqual(cssColors);
  });

  it("tokens.css 의 글자 유틸리티를 빠짐없이 보여준다", () => {
    const cssTypes = [...tokensCss.matchAll(/@utility (text-[\w-]+)/g)].map(
      (m) => m[1],
    );
    expect(typeTokens.map((t) => t.className)).toEqual(cssTypes);
  });

  it("색 견본 26개와 글자 견본 7개를 렌더링한다", () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages}>
        <TokenSheet />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole("heading", { name: "색 (26개)" }),
    ).toBeInTheDocument();
    const [colors, types] = screen.getAllByRole("list");
    expect(colors.children).toHaveLength(26);
    expect(types.children).toHaveLength(7);
  });
});
