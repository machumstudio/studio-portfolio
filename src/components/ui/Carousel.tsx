"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "./Button";
import { cx } from "./cx";

type CarouselProps = {
  /** 캐러셀 이름이 되는 제목 요소의 id (보통 header 안의 h2) */
  labelledBy: string;
  previousLabel: string;
  nextLabel: string;
  /** 슬라이드마다 붙일 라벨 ("1 / 6"). 서버 컴포넌트에서 함수를 넘길 수 없어 문자열 배열로 받는다 */
  slideLabels: string[];
  /** 위쪽 제목 영역. lg 부터 오른쪽에 화살표가 붙는다 */
  header: ReactNode;
  /** 슬라이드. 한 화면에 mobile 1 / md 2 / lg 3 장 */
  children: ReactNode;
  id?: string;
  className?: string;
};

// 화살표로 넘기는 가로 슬라이더. WAI-ARIA Carousel 패턴(자동 넘김 없음):
// section(aria-roledescription="carousel") 안에 이전/다음 버튼과 슬라이드(role=group, aria-roledescription="slide", "n / 전체").
// 스와이프는 브라우저 스크롤 + scroll-snap 에 맡기고, 화살표는 슬라이드 한 장 폭만큼 스크롤한다
// (reduced-motion 이면 부드러운 스크롤 없이 바로). 끝에 닿으면 그쪽 화살표는 aria-disabled.
// 화살표는 DOM 에서 슬라이드보다 앞이라 Tab 순서도 화살표 → 슬라이드. mobile 은 보이는 위치만 슬라이드 아래.
// 수치: docs/design/nodes/home-*.json 의 Testimonials "Container".
// 제목-카드 간격 40/60/80, 카드 간격 20/20/30, 제목 줄 아래 테두리 Dark/12 + 아래 여백 20/40/50 (화살표 묶음도 같은 줄),
// 화살표 묶음 Dark/03 + 테두리 Dark/12 알약(pad 8/8/10, 간격 12/12/16), 버튼 48/48/62 (Button icon lg).
export function Carousel({
  labelledBy,
  previousLabel,
  nextLabel,
  slideLabels,
  header,
  children,
  id,
  className,
}: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const slides = Children.toArray(children);

  const updateEdge = useCallback(() => {
    const track = trackRef.current!;
    setEdge({
      start: track.scrollLeft <= 1,
      end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    updateEdge();
    window.addEventListener("resize", updateEdge);
    return () => window.removeEventListener("resize", updateEdge);
  }, [updateEdge]);

  const move = (direction: 1 | -1) => {
    const track = trackRef.current!;
    const slide = track.firstElementChild as HTMLElement | null;
    if (!slide) return;
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    track.scrollBy({
      left: direction * slide.offsetWidth,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  const arrowClass = "aria-disabled:cursor-default aria-disabled:opacity-40";

  return (
    <section
      id={id}
      aria-roledescription="carousel"
      aria-labelledby={labelledBy}
      className={cx(
        "flex flex-col gap-10 lg:flex-row lg:flex-wrap lg:gap-x-0 lg:gap-y-15 3xl:gap-y-20",
        className,
      )}
    >
      <div className="border-b border-dark-12 pb-4.75 lg:flex-1 lg:pb-9.75 3xl:pb-12.25">
        {header}
      </div>
      <div className="order-last self-center lg:order-none lg:flex lg:items-end lg:self-stretch lg:border-b lg:border-dark-12 lg:pb-9.75 3xl:pb-12.25">
        <div className="flex gap-3 rounded-full border border-dark-12 bg-dark-03 p-1.75 3xl:gap-4 3xl:p-2.25">
          <Button
            variant="icon"
            size="lg"
            aria-label={previousLabel}
            aria-controls={`${labelledBy}-track`}
            aria-disabled={edge.start}
            onClick={() => move(-1)}
            className={arrowClass}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="icon"
            size="lg"
            aria-label={nextLabel}
            aria-controls={`${labelledBy}-track`}
            aria-disabled={edge.end}
            onClick={() => move(1)}
            className={arrowClass}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="min-w-0 lg:basis-full">
        <div
          ref={trackRef}
          id={`${labelledBy}-track`}
          onScroll={updateEdge}
          className="-mx-2.5 scrollbar-none flex snap-x snap-mandatory overflow-x-auto 3xl:-mx-3.75"
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              role="group"
              aria-roledescription="slide"
              aria-label={slideLabels[index]}
              className="flex w-full shrink-0 snap-start px-2.5 md:w-1/2 lg:w-1/3 3xl:px-3.75"
            >
              {slide}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
