"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { Button } from "./Button";

export type LightboxImage = { src: string; alt: string };

type LightboxProps = {
  images: LightboxImage[];
  /** 보고 있는 사진 순번. null 이면 닫힘 */
  index: number | null;
  onIndexChange: (index: number) => void;
  /** Esc, 닫기 버튼, 바깥(배경) 클릭 모두 여기로 온다. 포커스 복귀는 여는 쪽이 한다 */
  onClose: () => void;
  /** 다이얼로그 이름 (예: "단단한 얼굴들 사진") */
  label: string;
  closeLabel: string;
  previousLabel: string;
  nextLabel: string;
  /** 사진마다 "n / 전체". 서버 컴포넌트에서 함수를 넘길 수 없어 배열로 받는다 */
  positionLabels: string[];
};

// 스와이프로 볼 최소 가로 이동(px). 이보다 짧으면 탭으로 본다
const swipeThreshold = 50;

const focusable =
  'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

// 사진 크게 보기. 네이티브 <dialog> + showModal() (WAI-ARIA Dialog (Modal) 패턴):
// 바깥은 브라우저가 inert 로 막고, Tab/Shift+Tab 은 다이얼로그 안에서 돈다 (브라우저 주소창으로 새지 않게 직접 잡는다).
// 열리면 닫기 버튼에 포커스, Esc 는 브라우저 기본 동작(cancel → close)을 그대로 쓴다.
// ←/→ 키, 이전/다음 버튼, 가로 스와이프로 넘기고 끝에서는 처음/끝으로 돈다. 순번은 aria-live 로 읽힌다.
// 색은 토큰만: 배경 Dark/03 (95%), 버튼은 Button icon (Carousel 화살표와 같은 알약 묶음).
export function Lightbox({
  images,
  index,
  onIndexChange,
  onClose,
  label,
  closeLabel,
  previousLabel,
  nextLabel,
  positionLabels,
}: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipeFrom = useRef<number | null>(null);
  const open = index !== null;

  useEffect(() => {
    const dialog = dialogRef.current!;
    if (open && !dialog.open) {
      dialog.showModal();
      closeRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const go = (step: 1 | -1) => {
    if (index === null) return;
    onIndexChange((index + step + images.length) % images.length);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "ArrowRight") go(1);
    else if (event.key === "ArrowLeft") go(-1);
    else if (event.key === "Tab") {
      const items = [
        ...event.currentTarget.querySelectorAll<HTMLElement>(focusable),
      ];
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };

  const onPointerDown = (event: PointerEvent) => {
    swipeFrom.current = event.clientX;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (swipeFrom.current === null) return;
    const distance = event.clientX - swipeFrom.current;
    swipeFrom.current = null;
    if (Math.abs(distance) >= swipeThreshold) go(distance < 0 ? 1 : -1);
  };

  const image = index === null ? null : images[index];

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-label={label}
      onClose={onClose}
      onKeyDown={onKeyDown}
      // 사진 바깥 배경을 누르면 닫는다 (다이얼로그 자신이 눌렸을 때만)
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-0 h-dvh max-h-none w-dvw max-w-none bg-dark-03/95 p-0 text-white backdrop:bg-dark-03/80"
    >
      {image && (
        <div className="flex h-full flex-col gap-4 p-4 lg:gap-6 lg:p-10 3xl:p-12.5">
          <div className="flex items-center justify-between">
            <p aria-live="polite" className="text-body text-grey-70">
              {positionLabels[index!]}
            </p>
            <Button
              ref={closeRef}
              variant="icon"
              aria-label={closeLabel}
              onClick={onClose}
            >
              <X />
            </Button>
          </div>
          <div
            className="relative min-h-0 flex-1 touch-pan-y select-none"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (swipeFrom.current = null)}
          >
            <Image
              key={image.src + index}
              src={image.src}
              alt={image.alt}
              fill
              sizes="100vw"
              draggable={false}
              className="object-contain"
            />
          </div>
          <div className="flex gap-3 self-center rounded-full border border-dark-12 bg-dark-03 p-1.75 3xl:gap-4 3xl:p-2.25">
            <Button
              variant="icon"
              size="lg"
              aria-label={previousLabel}
              onClick={() => go(-1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="icon"
              size="lg"
              aria-label={nextLabel}
              onClick={() => go(1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}
