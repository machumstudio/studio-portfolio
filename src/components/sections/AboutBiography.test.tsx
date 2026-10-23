import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/ko.json";
import { AboutBiography } from "./AboutBiography";

describe("AboutBiography", () => {
  it("제목이 섹션 이름이고 문단을 순서대로 보여준다", () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages}>
        <AboutBiography paragraphs={["첫 문단", "둘째 문단"]} />
      </NextIntlClientProvider>,
    );
    const section = screen.getByRole("region", { name: "우리의 이야기" });
    expect(
      [...section.querySelectorAll("p")].map((p) => p.textContent),
    ).toEqual(["첫 문단", "둘째 문단"]);
  });
});
