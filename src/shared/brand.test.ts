import { describe, expectTypeOf, it } from "vitest";
import type { Brand } from "./brand";

type InquiryId = Brand<string, "InquiryId">;
type WorkId = Brand<string, "WorkId">;

describe("Brand", () => {
  it("이름이 다른 브랜드끼리, 그리고 맨 문자열과는 섞이지 않는다", () => {
    expectTypeOf<InquiryId>().not.toEqualTypeOf<WorkId>();
    expectTypeOf<string>().not.toExtend<InquiryId>();
    expectTypeOf<InquiryId>().toExtend<string>();
  });
});
