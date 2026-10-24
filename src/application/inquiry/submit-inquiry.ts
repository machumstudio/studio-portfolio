import {
  createInquiry,
  type Inquiry,
  type InquiryError,
  type InquiryInput,
} from "@/domain/inquiry/inquiry";
import { err, ok, type Result } from "@/shared/result";
import type { Clock, InquiryIdGenerator } from "./clock";
import type { InquiryRepository } from "./inquiry-repository";
import type { Notifier } from "./notifier";

export type SubmitInquiryError =
  InquiryError | { type: "StorageFailed"; cause: unknown };

// 저장은 됐지만 따로 알려야 하는 일. 사용자에게는 성공으로 보이고, 서버 로그에 남긴다
export type SubmitInquiryWarning = {
  type: "NotificationFailed";
  cause: unknown;
};

export type SubmitInquiryResult = {
  inquiry: Inquiry;
  warnings: readonly SubmitInquiryWarning[];
};

type Deps = {
  repo: InquiryRepository;
  notifier: Notifier;
  clock: Clock;
  ids: InquiryIdGenerator;
};

// 문의 제출: 검증 → 저장 → 알림. 알림 실패는 저장을 되돌리지 않고 경고로 돌려준다 (docs/adr/0007).
// 검증이나 저장이 실패하면 알림을 보내지 않는다
export const submitInquiry =
  ({ repo, notifier, clock, ids }: Deps) =>
  async (
    input: InquiryInput,
  ): Promise<Result<SubmitInquiryResult, SubmitInquiryError>> => {
    const created = createInquiry(input, {
      id: ids.next(),
      receivedAt: clock.now(),
    });
    if (!created.ok) return created;
    const inquiry = created.value;

    try {
      await repo.save(inquiry);
    } catch (cause) {
      return err({ type: "StorageFailed", cause });
    }

    try {
      await notifier.notifyNewInquiry(inquiry);
      return ok({ inquiry, warnings: [] });
    } catch (cause) {
      return ok({
        inquiry,
        warnings: [{ type: "NotificationFailed", cause }],
      });
    }
  };
