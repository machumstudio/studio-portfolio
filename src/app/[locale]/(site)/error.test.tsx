import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../../messages/en.json";
import ko from "../../../../messages/ko.json";
import SiteError from "./error";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: { href: string }) => <a href={href} {...props} />,
}));

const renderError = (locale: "ko" | "en", retry = vi.fn()) => {
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "ko" ? ko : en}
    >
      <SiteError error={new Error("db down")} retry={retry} />
    </NextIntlClientProvider>,
  );
  return retry;
};

// 공개 화면 오류 (저장소 장애 등): 사이트 틀 안의 본문, ko/en 문구, 다시 시도와 홈으로
describe("SiteError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("ko: 제목, 안내, 다시 시도와 홈으로. 오류 내용은 보이지 않는다", async () => {
    const retry = renderError("ko");
    expect(
      screen.getByRole("heading", { level: 1, name: /잠시 문제가 생겼어요/ }),
    ).toBeVisible();
    expect(screen.getByText(/잠시 후 다시 시도해 주세요/)).toBeVisible();
    expect(screen.queryByText(/db down/)).toBeNull();
    expect(screen.getByRole("link", { name: "홈으로" })).toHaveAttribute(
      "href",
      "/",
    );
    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(document.title).toBe("잠시 문제가 생겼어요 | Machum Studio");
  });

  it("en: 같은 화면이 영어로", () => {
    renderError("en");
    expect(
      screen.getByRole("heading", { level: 1, name: /Something went wrong/ }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Home" })).toBeVisible();
  });

  it("오류는 브라우저 콘솔에 남긴다 (서버 로그와 digest 로 잇는다)", () => {
    renderError("ko");
    expect(console.error).toHaveBeenCalledWith(new Error("db down"));
  });
});
