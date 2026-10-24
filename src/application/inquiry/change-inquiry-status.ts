import {
  parseInquiryId,
  transitionInquiry,
  type Inquiry,
} from "@/domain/inquiry/inquiry";
import type { InquiryAction, InvalidTransition } from "@/domain/inquiry/status";
import { err, ok, type Result } from "@/shared/result";
import type { Clock } from "./clock";
import type { InquiryRepository } from "./inquiry-repository";

export type ChangeInquiryStatusError =
  | { type: "NotFound"; id: string }
  | InvalidTransition
  | { type: "StorageFailed"; cause: unknown };

type Deps = { repo: InquiryRepository; clock: Clock };

// 관리자 상태 변경 (19칸): 조회 → 전이 → 저장. 빈 ID 는 저장소에 묻지 않고 NotFound.
// 허용 안 된 전이면 저장하지 않는다
export const changeInquiryStatus =
  ({ repo, clock }: Deps) =>
  async (
    id: string,
    action: InquiryAction,
  ): Promise<Result<Inquiry, ChangeInquiryStatusError>> => {
    const parsed = parseInquiryId(id);
    if (!parsed.ok) return err({ type: "NotFound", id });

    try {
      const found = await repo.findById(parsed.value);
      if (!found) return err({ type: "NotFound", id });

      const changed = transitionInquiry(found, action, clock.now());
      if (!changed.ok) return changed;

      await repo.save(changed.value);
      return ok(changed.value);
    } catch (cause) {
      return err({ type: "StorageFailed", cause });
    }
  };
