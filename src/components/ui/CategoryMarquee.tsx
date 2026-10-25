"use client";

import { Pause, Sparkle } from "lucide-react";
import { useState } from "react";
import { cx } from "./cx";

const repeats = [0, 1, 2];

type CategoryMarqueeProps = {
  /** 흘려 보낼 항목 (촬영 분야 이름) */
  items: string[];
  /** 목록 이름 (보조기기용) */
  label: string;
  /** 움직임 멈춤 토글 버튼 이름 (키보드 포커스에서만 보인다) */
  pauseLabel: string;
  /** 항목 글자의 언어. 화면 언어와 다르면 준다 (ko 화면의 장식 영어 → "en") */
  itemLang?: string;
  className?: string;
};

// 수치: docs/design/nodes 의 마키 "Container" (Home 히어로 아래, 푸터 워드마크 아래).
// 높이 62/62/80 (위아래 테두리 1px 은 inside 라 패딩에서 1px 뺌), 항목 간격 16/16/20,
// 아이콘 30/30/40 + 글자 간격 6/6/10, 글자 14/14/18 Regular 150% Purple/90 대문자.
// 같은 줄 두 벌을 이어 붙여 -50% 만큼 흘린다. 한 줄이 화면(최대 1920)보다 짧으면 끝에 빈칸이 보이므로
// 한 줄 안에 목록을 3번 반복한다. 처음 한 번만 보조기기에 읽히고 나머지 반복과 두 번째 벌은 숨긴다.
// 끝없이 움직이는 장식이라 멈출 수 있게 한다 (WCAG 2.2.2):
// - prefers-reduced-motion: reduce 이면 motion-safe 가 꺼져 처음 위치에 멈춘다
// - 마우스를 올리면 그 자리에 멈춘다
// - 멈춤 토글 버튼(aria-pressed). 평소에는 보이지 않고 키보드 포커스에서 띠 오른쪽에 나타난다 (시안 모양 그대로)
export function CategoryMarquee({
  items,
  label,
  pauseLabel,
  itemLang,
  className,
}: CategoryMarqueeProps) {
  const [paused, setPaused] = useState(false);
  const list = (hidden: boolean) => (
    <ul
      aria-label={hidden ? undefined : label}
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-4 pr-4 3xl:gap-5 3xl:pr-5"
    >
      {repeats.flatMap((round) =>
        items.map((item) => (
          <li
            key={`${round}-${item}`}
            aria-hidden={round > 0 || undefined}
            lang={itemLang}
            className="flex items-center gap-1.5 text-button font-normal whitespace-nowrap text-purple-90 uppercase 3xl:gap-2.5"
          >
            <Sparkle
              className="size-7.5 shrink-0 text-purple-80 3xl:size-10"
              strokeWidth={1.25}
            />
            {item}
          </li>
        )),
      )}
    </ul>
  );

  return (
    <div
      className={cx(
        "group relative overflow-hidden border-y border-dark-12 bg-dark-06 py-3.75 3xl:py-4.75",
        className,
      )}
    >
      <div
        data-testid="marquee-track"
        className={cx(
          "flex w-max group-hover:animation-paused! motion-safe:animate-marquee",
          paused && "animation-paused!",
        )}
      >
        {list(false)}
        {list(true)}
      </div>
      <button
        type="button"
        aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
        // sr-only 상자(1px, 안쪽 여백 0)를 깨지 않게 모양은 모두 포커스 때만 준다
        className={cx(
          "sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-1/2 focus-visible:right-4 focus-visible:-translate-y-1/2",
          "focus-visible:inline-flex focus-visible:items-center focus-visible:gap-2 focus-visible:rounded-full focus-visible:border focus-visible:border-purple-70",
          "focus-visible:bg-dark-06 focus-visible:px-4 focus-visible:py-2 focus-visible:text-label focus-visible:text-white",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-70",
        )}
      >
        <Pause aria-hidden className="size-4" />
        {pauseLabel}
      </button>
    </div>
  );
}
