import { describe, expect, it } from "vitest";
import { err } from "@/shared/result";
import { arrangeImages, type WorkImage } from "./images";

const image = (src: string, order: number): WorkImage => ({
  src,
  alt: { ko: "", en: "" },
  order,
});

describe("arrangeImages", () => {
  it("순서대로 정렬하고 대표 이미지를 목록에서 찾는다", () => {
    const result = arrangeImages(
      [image("c.jpg", 2), image("a.jpg", 0), image("b.jpg", 1)],
      "b.jpg",
    );
    expect(result).toEqual({
      ok: true,
      value: {
        images: [image("a.jpg", 0), image("b.jpg", 1), image("c.jpg", 2)],
        cover: image("b.jpg", 1),
      },
    });
  });

  it("사진 한 장이면 그 사진이 대표 이미지다", () => {
    const result = arrangeImages([image("a.jpg", 0)], "a.jpg");
    expect(result.ok && result.value.cover).toEqual(image("a.jpg", 0));
  });

  it("같은 순서가 두 번 나오면 DuplicateImageOrder", () => {
    expect(
      arrangeImages(
        [image("a.jpg", 0), image("b.jpg", 1), image("c.jpg", 1)],
        "a.jpg",
      ),
    ).toEqual(err({ type: "DuplicateImageOrder", order: 1 }));
  });

  it.each([
    { orders: [0, 2], missing: 1 },
    { orders: [1, 2], missing: 0 },
    { orders: [0, -1], missing: 1 },
    { orders: [0, 1.5], missing: 1 },
  ])(
    "순서 $orders 는 $missing 이 빠져 MissingImageOrder",
    ({ orders, missing }) => {
      expect(
        arrangeImages(
          orders.map((order, i) => image(`${i}.jpg`, order)),
          "0.jpg",
        ),
      ).toEqual(err({ type: "MissingImageOrder", order: missing }));
    },
  );

  it("대표 이미지가 목록에 없으면 CoverNotInImages", () => {
    expect(arrangeImages([image("a.jpg", 0)], "z.jpg")).toEqual(
      err({ type: "CoverNotInImages", src: "z.jpg" }),
    );
  });

  it("사진이 없으면 대표 이미지도 없어 CoverNotInImages", () => {
    expect(arrangeImages([], "a.jpg")).toEqual(
      err({ type: "CoverNotInImages", src: "a.jpg" }),
    );
  });
});
