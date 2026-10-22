import { Sparkle } from "lucide-react";
import { cx } from "./cx";

const repeats = [0, 1, 2];

type CategoryMarqueeProps = {
  /** 흘려 보낼 항목 (촬영 분야 이름) */
  items: string[];
  /** 목록 이름 (보조기기용) */
  label: string;
  className?: string;
};

// 수치: docs/design/nodes 의 마키 "Container" (Home 히어로 아래, 푸터 워드마크 아래).
// 높이 62/62/80 (위아래 테두리 1px 은 inside 라 패딩에서 1px 뺌), 항목 간격 16/16/20,
// 아이콘 30/30/40 + 글자 간격 6/6/10, 글자 14/14/18 Regular 150% Purple/90 대문자.
// 같은 줄 두 벌을 이어 붙여 -50% 만큼 흘린다. 한 줄이 화면(최대 1920)보다 짧으면 끝에 빈칸이 보이므로
// 한 줄 안에 목록을 3번 반복한다. 처음 한 번만 보조기기에 읽히고 나머지 반복과 두 번째 벌은 숨긴다.
// prefers-reduced-motion: reduce 이면 motion-safe 가 꺼져 처음 위치에 멈춘다.
export function CategoryMarquee({
  items,
  label,
  className,
}: CategoryMarqueeProps) {
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
        "overflow-hidden border-y border-dark-12 bg-dark-06 py-3.75 3xl:py-4.75",
        className,
      )}
    >
      <div
        data-testid="marquee-track"
        className="flex w-max motion-safe:animate-marquee"
      >
        {list(false)}
        {list(true)}
      </div>
    </div>
  );
}
