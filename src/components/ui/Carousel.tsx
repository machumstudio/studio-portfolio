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
  /** 화살표 오른쪽 버튼 (예: "모두 보기"). mobile 은 제목 아래, 구분선 위 */
  actions?: ReactNode;
  /** lg 부터 화살표/버튼의 세로 정렬. 제목만 있으면 center, 제목 아래 내용이 더 있으면 end */
  alignControls?: "center" | "end";
  /** 제목 줄 아래 구분선. Portfolio 갤러리처럼 섹션 위 테두리로 나누는 곳은 끈다 */
  divider?: boolean;
  /** 화살표 묶음 위치를 바꿀 때 (예: mobile 에서 슬라이드와의 간격) */
  controlsClassName?: string;
  /** 슬라이드. 한 화면에 mobile 1 / md 2 / lg 3 장 */
  children: ReactNode;
  id?: string;
  className?: string;
  /** 슬라이드 간격(트랙 음수 margin)을 바꿀 때. slideClassName 의 padding 과 짝을 맞춘다 */
  trackClassName?: string;
  /** 슬라이드 폭/간격을 바꿀 때 (예: 한 장씩 "md:w-full lg:w-full") */
  slideClassName?: string;
};

// 화살표로 넘기는 가로 슬라이더. WAI-ARIA Carousel 패턴(자동 넘김 없음):
// section(aria-roledescription="carousel") 안에 이전/다음 버튼과 슬라이드(role=group, aria-roledescription="slide", "n / 전체").
// 스와이프는 브라우저 스크롤 + scroll-snap 에 맡기고, 화살표는 슬라이드 한 장 폭만큼 스크롤한다
// (reduced-motion 이면 부드러운 스크롤 없이 바로). 끝에 닿으면 그쪽 화살표는 aria-disabled.
// 화살표는 DOM 에서 슬라이드보다 앞이라 Tab 순서도 화살표 → 슬라이드. mobile 은 보이는 위치만 슬라이드 아래.
// 수치: docs/design/nodes/home-*.json 의 Testimonials "Container".
// 제목-카드 간격 40/60/80, 카드 간격 20/20/30, 제목 줄 아래 테두리 Dark/12 + 아래 여백 20/40/50 (화살표 묶음도 같은 줄),
// 화살표 묶음 Dark/03 + 테두리 Dark/12 알약(pad 8/8/10, 간격 12/12/16), 버튼 48/48/62 (Button icon lg).
// Home Services/Portfolio 처럼 화살표 오른쪽에 버튼(actions)이 붙으면 lg 간격 20/30 (둘은 서로 세로 가운데),
// mobile 은 제목 아래 간격 20.
// 한 화면 장수와 슬라이드 간격은 slideClassName/trackClassName 으로 덮어쓴다 (cx 가 뒤쪽을 남긴다).
export function Carousel({
  labelledBy,
  previousLabel,
  nextLabel,
  slideLabels,
  header,
  actions,
  alignControls = "end",
  divider = true,
  controlsClassName,
  children,
  id,
  className,
  trackClassName,
  slideClassName,
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
  // 제목 줄 구분선: 제목 칸과 컨트롤 칸이 각자 아래 테두리를 그려 한 줄로 잇는다
  const rule =
    divider && "border-b border-dark-12 pb-4.75 lg:pb-9.75 3xl:pb-12.25";
  const lgRule =
    divider && "lg:border-b lg:border-dark-12 lg:pb-9.75 3xl:pb-12.25";

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
      {/* 버튼이 있으면 mobile 구분선은 버튼 아래로 */}
      <div className={cx("lg:flex-1", actions ? lgRule : rule)}>{header}</div>
      {/* 컨트롤 칸: lg 는 화살표와 버튼을 한 줄에 서로 가운데 맞춰 놓고, 칸 전체를 제목 줄 아래(end) 또는 가운데(center)에 둔다.
          mobile 은 칸을 풀어(contents) 화살표는 슬라이드 아래, 버튼은 제목 아래로 보낸다 */}
      <div
        className={cx(
          "contents lg:flex lg:items-center lg:gap-5 3xl:gap-7.5",
          alignControls === "end" ? "lg:self-end" : "lg:self-stretch",
          lgRule,
        )}
      >
        <div
          className={cx(
            "order-last flex gap-3 self-center rounded-full border border-dark-12 bg-dark-03 p-1.75 lg:order-none 3xl:gap-4 3xl:p-2.25",
            controlsClassName,
          )}
        >
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
        {actions && (
          // mobile: 제목과 간격 20 (섹션 간격 40 에서 20 을 당김) + 구분선
          <div className="-mt-5 flex items-start border-b border-dark-12 pb-4.75 lg:mt-0 lg:border-0 lg:pb-0">
            {actions}
          </div>
        )}
      </div>
      <div className="min-w-0 lg:basis-full">
        <div
          ref={trackRef}
          id={`${labelledBy}-track`}
          onScroll={updateEdge}
          className={cx(
            "relative -mx-2.5 scrollbar-none flex snap-x snap-mandatory overflow-x-auto 3xl:-mx-3.75",
            trackClassName,
          )}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              role="group"
              aria-roledescription="slide"
              aria-label={slideLabels[index]}
              className={cx(
                "flex w-full shrink-0 snap-start px-2.5 md:w-1/2 lg:w-1/3 3xl:px-3.75",
                slideClassName,
              )}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
