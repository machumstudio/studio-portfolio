import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TestimonialCard } from "./TestimonialCard";

const renderCard = (rating = 5) =>
  render(
    <TestimonialCard
      name="Emily Johnson"
      location="미국, 캘리포니아"
      rating={rating}
      ratingLabel={`5점 만점에 ${rating}점`}
      quote="결과물이 정말 매혹적이에요."
      socials={[
        {
          label: "Emily Johnson의 Instagram (새 탭에서 열림)",
          href: "https://www.instagram.com/",
          iconPath: "M0 0h24v24H0z",
        },
        {
          label: "Emily Johnson의 X (새 탭에서 열림)",
          href: "https://x.com/",
          iconPath: "M0 0h24v24H0z",
        },
      ]}
    />,
  );

describe("TestimonialCard", () => {
  it("article 안에 이름(제목), 지역, 인용 본문을 둔다", () => {
    renderCard();
    const card = screen.getByRole("article");
    expect(within(card).getByRole("heading", { level: 3 })).toHaveTextContent(
      "Emily Johnson",
    );
    expect(within(card).getByText("미국, 캘리포니아")).toBeInTheDocument();
    expect(card.querySelector("blockquote")).toHaveTextContent(
      "결과물이 정말 매혹적이에요.",
    );
  });

  it("별점은 이름 있는 그림 하나로 읽히고, 별 5개 중 점수만큼 채운다", () => {
    renderCard(4);
    const rating = screen.getByRole("img", { name: "5점 만점에 4점" });
    const stars = rating.querySelectorAll("svg");
    expect(stars).toHaveLength(5);
    expect(
      [...stars].filter((s) => s.classList.contains("fill-star")),
    ).toHaveLength(4);
  });

  it("소셜 링크는 이름이 있고 새 탭으로 안전하게 연다", () => {
    renderCard();
    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.getAttribute("aria-label"))).toEqual([
      "Emily Johnson의 Instagram (새 탭에서 열림)",
      "Emily Johnson의 X (새 탭에서 열림)",
    ]);
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
