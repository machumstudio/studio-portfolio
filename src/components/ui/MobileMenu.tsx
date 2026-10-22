"use client";

import { TextAlignEnd, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cx } from "./cx";

type MobileMenuProps = {
  openLabel: string;
  closeLabel: string;
  /** 펼친 패널 내용 (보통 <nav> 와 링크 목록) */
  children: ReactNode;
  className?: string;
};

const focusableSelector = 'a[href], button:not([disabled]), [tabindex="0"]';

// 모바일 햄버거 메뉴: 디스클로저(버튼 + aria-expanded/aria-controls) 패턴에
// Esc 닫기와 포커스 트랩을 더한다. 열려 있는 동안 Tab 은 토글 버튼과 패널 안에서만 돈다.
// 패널은 가장 가까운 position 조상(헤더)의 바로 아래에 붙는다. 링크를 누르면 닫힌다.
// 버튼 수치: 노드 "Navbar > Button" 68x68, 위/왼쪽 테두리 Dark/12, 왼쪽 위 radius 16(시안 픽셀 실측), 아이콘 28.
// 시안에 펼친 화면은 없어 기존 토큰으로 설계했다.
export function MobileMenu({
  openLabel,
  closeLabel,
  children,
  className,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const root = rootRef.current!;
    const focusables = () =>
      Array.from(root.querySelectorAll<HTMLElement>(focusableSelector));

    panelRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!root.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    // 패널이 화면을 덮는 동안 뒤 페이지가 스크롤되지 않게 한다
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cx("lg:hidden", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((v) => !v)}
        className="flex h-16.75 w-17 cursor-pointer items-center justify-center rounded-tl-2xl border-t border-l border-dark-12 text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-purple-70"
      >
        {open ? (
          <X className="size-7" strokeWidth={1.5} />
        ) : (
          <TextAlignEnd className="size-7" strokeWidth={1.5} />
        )}
      </button>
      <div
        ref={panelRef}
        id={panelId}
        hidden={!open}
        onClick={(event) => {
          if ((event.target as Element).closest("a")) setOpen(false);
        }}
        className="absolute inset-x-0 top-full z-40 h-dvh overflow-y-auto bg-dark-03 px-4"
      >
        {children}
      </div>
    </div>
  );
}
