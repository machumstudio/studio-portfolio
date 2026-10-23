import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/ko.json";
import { AboutTimeline } from "./AboutTimeline";

const items = [
  { year: 2005, body: "첫 카메라" },
  { year: 2015, body: "스튜디오 시작" },
];

describe("AboutTimeline", () => {
  it("연표는 순서 있는 목록이고, 항목마다 해(h3, <time>)와 내용이 있다", () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages}>
        <AboutTimeline items={items} />
      </NextIntlClientProvider>,
    );
    const section = screen.getByRole("region", {
      name: "마춤 스튜디오의 발자취",
    });
    const list = within(section).getByRole("list");
    expect(list.tagName).toBe("OL");
    const entries = within(list).getAllByRole("listitem");
    expect(entries).toHaveLength(2);
    expect(
      within(entries[0]).getByRole("heading", { level: 3, name: "2005년" }),
    ).toBeInTheDocument();
    expect(entries[0].querySelector("time")).toHaveAttribute(
      "datetime",
      "2005",
    );
    expect(within(entries[1]).getByText("스튜디오 시작")).toBeInTheDocument();
  });
});
