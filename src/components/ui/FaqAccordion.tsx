"use client";

import { ChevronDown } from "lucide-react";
import {
  Fragment,
  useId,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cx } from "./cx";

export type FaqItem = { id: string; question: ReactNode; answer: ReactNode };

type FaqAccordionProps = {
  items: FaqItem[];
  /** true 면 여러 개를 함께 펼친다. false 면 하나를 펼칠 때 나머지를 닫는다 */
  multiple?: boolean;
  /** 처음에 펼쳐 둘 항목 id */
  defaultOpen?: string[];
  /** 2 면 lg 부터 앞 절반 | 뒤 절반 2열. lg 미만은 한 열로 이어진다 */
  columns?: 1 | 2;
  /** 질문 제목 수준. 섹션 제목이 h2 면 h3 */
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

const headerSelector = "[data-accordion-header]";

// 화살표 키로 옮겨 갈 헤더 위치. 위/아래는 끝에서 반대쪽 끝으로 돈다
const nextIndex = (key: string, index: number, count: number) =>
  ({
    ArrowDown: (index + 1) % count,
    ArrowUp: (index - 1 + count) % count,
    Home: 0,
    End: count - 1,
  })[key];

function Divider({ className }: { className?: string }) {
  return <div aria-hidden className={cx("h-px bg-dark-12", className)} />;
}

// WAI-ARIA Accordion 패턴: 제목 안의 button(aria-expanded, aria-controls) + region(aria-labelledby).
// Enter/Space 는 button 기본 동작, 위/아래/Home/End 는 헤더 사이 포커스 이동 (2열이어도 DOM 순서로 이어진다).
// 닫힌 패널은 inert 라 포커스와 보조기기에서 빠지고, collapsible 유틸리티가 높이를 접는다 (reduced-motion 이면 전환 없음).
// 수치: docs/design/nodes/home-*.json 의 FAQ "Sub Container" / "FAQ Container" (mobile → lg → 3xl).
// 열: pad 20 0(mobile, 두 열을 이어 붙인 바깥) / 30 0, 항목-구분선 간격 6/8/10, 왼쪽 열 오른쪽 테두리 Dark/12.
// 항목: pad 20 24 / 24 40 / 30 50, 질문(16/18/20 SemiBold Grey/70) - 버튼 간격 30/30/40,
//   원형 버튼 38/40/52(테두리 Dark/12, 아이콘 18/20/24 Grey/80, 펼치면 White), 답(text-body Grey/50)까지 20/20/30.
// mobile 은 펼쳐도 버튼이 질문 줄 가운데, lg 부터는 펼치면 위에 붙고 답은 버튼 열을 비워 둔다.
export function FaqAccordion({
  items,
  multiple = false,
  defaultOpen = [],
  columns = 1,
  headingLevel = 3,
  className,
}: FaqAccordionProps) {
  const [open, setOpen] = useState<string[]>(defaultOpen);
  const baseId = useId();
  const Heading = `h${headingLevel}` as const;

  const toggle = (id: string) =>
    setOpen((current) =>
      current.includes(id)
        ? current.filter((v) => v !== id)
        : multiple
          ? [...current, id]
          : [id],
    );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.matches(headerSelector)) return;
    const headers = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(headerSelector),
    );
    const index = nextIndex(event.key, headers.indexOf(target), headers.length);
    if (index === undefined) return;
    event.preventDefault();
    headers[index].focus();
  };

  const half = Math.ceil(items.length / 2);
  const groups =
    columns === 2 ? [items.slice(0, half), items.slice(half)] : [items];

  return (
    <div
      onKeyDown={onKeyDown}
      className={cx(
        "flex flex-col gap-1.5 py-5 lg:flex-row lg:items-start lg:gap-0 lg:py-0",
        className,
      )}
    >
      {groups.map((group, groupIndex) => (
        <Fragment key={groupIndex}>
          {groupIndex > 0 && <Divider className="lg:hidden" />}
          <div
            className={cx(
              "flex flex-col gap-1.5 lg:flex-1 lg:gap-2 lg:py-7.5 3xl:gap-2.5",
              groupIndex === 0 &&
                groups.length > 1 &&
                "lg:border-r lg:border-dark-12",
            )}
          >
            {group.map((item, index) => {
              const expanded = open.includes(item.id);
              const buttonId = `${baseId}-${item.id}-button`;
              const panelId = `${baseId}-${item.id}-panel`;
              return (
                <Fragment key={item.id}>
                  {index > 0 && <Divider />}
                  <div className="px-6 py-5 lg:px-10 lg:py-6 3xl:px-12.5 3xl:py-7.5">
                    <Heading>
                      <button
                        id={buttonId}
                        type="button"
                        data-accordion-header
                        aria-expanded={expanded}
                        aria-controls={panelId}
                        onClick={() => toggle(item.id)}
                        className="group relative flex min-h-9.5 w-full cursor-pointer items-center pr-17 text-left text-h4 break-keep text-grey-70 uppercase transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-70 lg:min-h-0 lg:pr-17.5 lg:not-aria-expanded:min-h-10 3xl:pr-23 3xl:not-aria-expanded:min-h-13"
                      >
                        {item.question}
                        <span
                          aria-hidden
                          className="absolute top-1/2 right-0 flex size-9.5 -translate-y-1/2 items-center justify-center rounded-full border border-dark-12 text-grey-80 group-aria-expanded:text-white lg:size-10 lg:group-aria-expanded:top-0 lg:group-aria-expanded:translate-y-0 3xl:size-13"
                        >
                          <ChevronDown
                            strokeWidth={2}
                            className="size-4.5 transition-transform group-aria-expanded:rotate-180 motion-reduce:transition-none lg:size-5 3xl:size-6"
                          />
                        </span>
                      </button>
                    </Heading>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      inert={!expanded}
                      className="collapsible"
                    >
                      <div className="min-h-0 overflow-hidden">
                        <p className="pt-5 text-body break-keep text-grey-50 lg:pr-17.5 3xl:pt-7.5 3xl:pr-23">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </Fragment>
              );
            })}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
