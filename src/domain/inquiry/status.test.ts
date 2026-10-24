import { describe, expect, it } from "vitest";
import { err, ok } from "@/shared/result";
import {
  inquiryActions,
  transitionStatus,
  type InquiryAction,
  type InquiryStatus,
  type InquiryStatusType,
} from "./status";

const before = new Date("2026-10-01T09:00:00Z");
const at = new Date("2026-10-02T10:30:00Z");

const statuses: Record<InquiryStatusType, InquiryStatus> = {
  New: { type: "New" },
  Read: { type: "Read", changedAt: before },
  Done: { type: "Done", changedAt: before },
};

// 상태 × 동작 전이표 전체. null 은 거부 (InvalidTransition)
const table: [InquiryStatusType, InquiryAction, InquiryStatusType | null][] = [
  ["New", "markRead", "Read"],
  ["New", "markDone", null],
  ["New", "reopen", null],
  ["Read", "markRead", null],
  ["Read", "markDone", "Done"],
  ["Read", "reopen", null],
  ["Done", "markRead", null],
  ["Done", "markDone", null],
  ["Done", "reopen", "Read"],
];

describe("transitionStatus", () => {
  it("전이표가 상태 3개 × 동작 3개를 빠짐없이 덮는다", () => {
    const pairs = new Set(table.map(([from, action]) => `${from}:${action}`));
    expect(pairs.size).toBe(
      Object.keys(statuses).length * inquiryActions.length,
    );
  });

  it.each(table.filter(([, , to]) => to !== null))(
    "%s --%s--> %s, 바뀐 시각을 남긴다",
    (from, action, to) => {
      expect(transitionStatus(statuses[from], action, at)).toEqual(
        ok({ type: to, changedAt: at }),
      );
    },
  );

  it.each(table.filter(([, , to]) => to === null))(
    "%s 에서 %s 는 InvalidTransition",
    (from, action) => {
      expect(transitionStatus(statuses[from], action, at)).toEqual(
        err({ type: "InvalidTransition", from, action }),
      );
    },
  );

  it("원래 상태 값을 바꾸지 않는다", () => {
    const read = statuses.Read;
    transitionStatus(read, "markDone", at);
    expect(read).toEqual({ type: "Read", changedAt: before });
  });
});
