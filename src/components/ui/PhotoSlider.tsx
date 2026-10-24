"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";
import { Button } from "./Button";
import { cx } from "./cx";

type PhotoSliderProps = {
  images: { src: string; alt: string }[];
  /** 슬라이더 이름 ("인물 촬영 사진") */
  label: string;
  previousLabel: string;
  nextLabel: string;
  /** 사진마다 붙일 라벨 ("1 / 3"). 서버 컴포넌트에서 함수를 넘길 수 없어 문자열 배열로 받는다 */
  slideLabels: string[];
  /** next/image sizes */
  sizes: string;
  /** 사진 상자 크기와 radius */
  photoClassName: string;
  className?: string;
};

// 시안 사진 아래 가운데의 홈 모양: BOOLEAN 이라 노드에 좌표가 없어 services-laptop.png 의 경계를 행마다 재서 옮겼다
// (폭 280, 깊이 46). mobile/desktop 은 같은 모양을 224x34 / 330x51 로 늘린다 (시안 픽셀).
const notch =
  "M0 46 L7 45 L10.5 44 L16.5 42 L24 39 L32 35 L41.5 30 L50 25 L58 20 L67 15 L76.5 10 L83 7 L88 5 L95 3 L99 2 L107.5 0 " +
  "L172.5 0 L181 2 L185 3 L192 5 L197 7 L203.5 10 L213 15 L222 20 L230 25 L238.5 30 L248 35 L256 39 L263.5 42 L269.5 44 L273 45 L280 46Z";

// 사진 한 장씩 넘기는 슬라이더 (Services 서비스 소개). 사진 아래 가운데 홈에 이전/다음 화살표 알약이 걸친다.
// WAI-ARIA Carousel 패턴(자동 넘김 없음): 묶음 role=group + aria-roledescription="carousel",
// 사진마다 role=group + aria-roledescription="slide" ("n / 전체"), 지금 사진만 보이고 바뀌면 aria-live 로 알린다.
// 화살표는 DOM 에서 사진보다 앞(Tab 순서), 보이는 위치만 아래. 끝에 닿으면 그쪽 화살표는 aria-disabled.
// 수치: docs/design/nodes/services-*.json 의 서비스 소개 "Sub Container" (사진 + "Buttons Container").
// 알약은 Carousel 화살표와 같다 (Dark/03 + 테두리 Dark/12, pad 8/8/10, 간격 12/12/16, 버튼 48/48/62).
// 알약이 사진 아래로 걸치는 깊이 24/30/38, 홈 깊이 34/46/51 (알약 위 여백 11/16/12).
export function PhotoSlider({
  images,
  label,
  previousLabel,
  nextLabel,
  slideLabels,
  sizes,
  photoClassName,
  className,
}: PhotoSliderProps) {
  const [index, setIndex] = useState(0);
  const photosId = useId();
  const last = images.length - 1;
  const arrowClass = "aria-disabled:cursor-default aria-disabled:opacity-40";

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      className={cx("flex flex-col items-center", className)}
    >
      <div className="relative order-last -mt-6 flex gap-3 rounded-full border border-dark-12 bg-dark-03 p-1.75 lg:-mt-7.5 3xl:-mt-9.5 3xl:gap-4 3xl:p-2.25">
        <Button
          variant="icon"
          size="lg"
          aria-label={previousLabel}
          aria-controls={photosId}
          aria-disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className={arrowClass}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="icon"
          size="lg"
          aria-label={nextLabel}
          aria-controls={photosId}
          aria-disabled={index === last}
          onClick={() => setIndex((i) => Math.min(last, i + 1))}
          className={arrowClass}
        >
          <ChevronRight />
        </Button>
      </div>
      <div
        id={photosId}
        aria-live="polite"
        className={cx(
          "relative w-full overflow-hidden bg-dark-15",
          photoClassName,
        )}
      >
        {images.map((image, i) => (
          <div
            key={`${image.src}-${i}`}
            role="group"
            aria-roledescription="slide"
            aria-label={slideLabels[i]}
            hidden={i !== index}
            data-visual-mask
            className="absolute inset-0"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes={sizes}
              className="object-cover"
            />
          </div>
        ))}
        <svg
          aria-hidden
          viewBox="0 0 280 46"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-1/2 h-8.5 w-56 -translate-x-1/2 fill-dark-03 lg:h-11.5 lg:w-70 3xl:h-12.75 3xl:w-82.5"
        >
          <path d={notch} />
        </svg>
      </div>
    </div>
  );
}
