import { parseInquiryId, type Inquiry } from "@/domain/inquiry/inquiry";
import {
  inquiryStatusTypes,
  type InquiryStatusType,
} from "@/domain/inquiry/status";
import { err, ok, type Result } from "@/shared/result";
import type {
  AdminInquiryRepository,
  InquiryStatusCounts,
} from "./admin-inquiry-repository";

// 관리자 문의 읽기와 지우기 (19칸). 상태 바꾸기는 changeInquiryStatus (12칸).
// 화면(features)은 domain 함수를 직접 부를 수 없어 버튼에 쓰는 규칙을 여기서 받는다
export {
  allowedInquiryActions,
  inquiryActions,
  inquiryStatusTypes,
} from "@/domain/inquiry/status";

type Deps = { repo: AdminInquiryRepository };

/** 한 페이지 문의 수 */
export const inquiryPageSize = 20;

export type InquiryListQuery = {
  /** null 이면 전체 */
  status: InquiryStatusType | null;
  /** 1부터. 범위를 벗어나면 가까운 페이지로 맞춘다 */
  page: number;
};

export type InquiryList = {
  items: readonly Inquiry[];
  counts: InquiryStatusCounts;
  /** 전체 문의 수 (counts 의 합) */
  total: number;
  status: InquiryStatusType | null;
  /** 실제로 보여 준 페이지 */
  page: number;
  /** 1 이상 (문의가 없어도 빈 페이지 하나) */
  pageCount: number;
};

const sum = (counts: InquiryStatusCounts) =>
  inquiryStatusTypes.reduce((total, type) => total + counts[type], 0);

/** 관리자 목록 상단의 상태별 개수와 메뉴의 "새 문의 N건" */
export const countInquiries =
  ({ repo }: Deps) =>
  async (): Promise<InquiryStatusCounts> =>
    repo.countByStatus();

/**
 * 관리자 문의 목록: 상태 필터 + 페이지 (최신순). 개수를 먼저 세서 페이지 수를 정하고,
 * 지운 뒤 마지막 페이지가 사라진 경우처럼 범위를 벗어난 페이지는 마지막 페이지를 보여 준다
 */
export const listInquiries =
  ({ repo }: Deps) =>
  async ({ status, page }: InquiryListQuery): Promise<InquiryList> => {
    const counts = await repo.countByStatus();
    const total = sum(counts);
    const matching = status ? counts[status] : total;
    const pageCount = Math.max(1, Math.ceil(matching / inquiryPageSize));
    const current = Math.min(
      Math.max(1, Number.isInteger(page) ? page : 1),
      pageCount,
    );
    const items =
      matching === 0
        ? []
        : await repo.findPage({
            status,
            offset: (current - 1) * inquiryPageSize,
            limit: inquiryPageSize,
          });
    return { items, counts, total, status, page: current, pageCount };
  };

/** 관리자 문의 상세. 주소의 id 가 비었거나 없으면 null */
export const getInquiry =
  ({ repo }: Deps) =>
  async (id: string): Promise<Inquiry | null> => {
    const parsed = parseInquiryId(id);
    return parsed.ok ? repo.findById(parsed.value) : null;
  };

export type DeleteInquiryError =
  { type: "NotFound"; id: string } | { type: "StorageFailed"; cause: unknown };

/** 문의 지우기 (개인정보 삭제 요청 등). 다른 탭에서 이미 지웠으면 NotFound */
export const deleteInquiry =
  ({ repo }: Deps) =>
  async (id: string): Promise<Result<void, DeleteInquiryError>> => {
    const parsed = parseInquiryId(id);
    if (!parsed.ok) return err({ type: "NotFound", id });
    try {
      return (await repo.remove(parsed.value))
        ? ok(undefined)
        : err({ type: "NotFound", id });
    } catch (cause) {
      return err({ type: "StorageFailed", cause });
    }
  };
