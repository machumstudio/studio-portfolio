import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import ko from "../../../messages/ko.json";
import { WorkPager } from "./WorkPager";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: { href: string }) => <a href={href} {...props} />,
}));

type Props = Parameters<typeof WorkPager>[0];
const renderPager = (props: Props) =>
  render(
    <NextIntlClientProvider locale="ko" messages={ko}>
      <WorkPager {...props} />
    </NextIntlClientProvider>,
  );

const faces = { slug: "faces-of-resilience", title: "단단한 얼굴들" };
const wedding = { slug: "a-wedding-tale", title: "어느 결혼식 이야기" };

describe("WorkPager", () => {
  it("이름 붙은 nav 안에 이전/다음 작업 링크 (라벨 + 제목, rel)", () => {
    renderPager({ previous: faces, next: wedding });
    const nav = screen.getByRole("navigation", { name: "다른 작업" });
    const links = nav.querySelectorAll("a");
    expect(
      [...links].map((a) => [
        a.textContent,
        a.getAttribute("href"),
        a.getAttribute("rel"),
      ]),
    ).toEqual([
      ["이전 작업단단한 얼굴들", "/work/faces-of-resilience", "prev"],
      ["다음 작업어느 결혼식 이야기", "/work/a-wedding-tale", "next"],
    ]);
  });

  it("처음/끝 작업이면 한쪽만 있다", () => {
    const { unmount } = renderPager({ previous: null, next: wedding });
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link")).toHaveAttribute("rel", "next");
    unmount();
    renderPager({ previous: faces, next: null });
    expect(screen.getByRole("link")).toHaveAttribute("rel", "prev");
  });

  it("둘 다 없으면 nav 를 그리지 않는다", () => {
    renderPager({ previous: null, next: null });
    expect(screen.queryByRole("navigation")).toBeNull();
  });
});
