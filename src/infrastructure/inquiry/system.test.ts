import { describe, expect, it, vi } from "vitest";
import { randomInquiryIds, systemClock } from "./system";

describe("systemClock", () => {
  it("지금 시각을 준다", () => {
    vi.useFakeTimers({ now: new Date("2026-10-24T09:00:00Z") });
    expect(systemClock.now()).toEqual(new Date("2026-10-24T09:00:00Z"));
    vi.useRealTimers();
  });
});

describe("randomInquiryIds", () => {
  it("UUID v4 를 매번 새로 만든다", () => {
    const ids = Array.from({ length: 100 }, () => randomInquiryIds.next());
    for (const id of ids)
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    expect(new Set(ids).size).toBe(ids.length);
  });
});
