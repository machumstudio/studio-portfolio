"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { cx } from "./cx";
import { Lightbox, type LightboxImage } from "./Lightbox";

type GalleryProps = {
  images: LightboxImage[];
  /** 썸네일 버튼 이름 ("사진 1 크게 보기"). 사진마다 하나 */
  openLabels: string[];
  /** Lightbox 문구 (이름, 닫기/이전/다음, 사진마다 "n / 전체") */
  lightbox: {
    label: string;
    closeLabel: string;
    previousLabel: string;
    nextLabel: string;
    positionLabels: string[];
  };
  className?: string;
};

// 작업 사진 썸네일 격자 + Lightbox. 썸네일은 버튼이라 Tab/Enter/Space 로 연다.
// 닫히면(Esc, 닫기, 배경) 연 썸네일로 포커스를 돌려준다 (안에서 다른 사진으로 넘겼어도).
// 썸네일 크기: PortfolioCard gallery 사진과 같은 335/409/519 높이, radius 16/16/20,
// 한 줄 mobile 1 / md 2 / lg 3 장, 간격 20/40/50 (Portfolio 갤러리 카드 간격).
export function Gallery({
  images,
  openLabels,
  lightbox,
  className,
}: GalleryProps) {
  const [index, setIndex] = useState<number | null>(null);
  const thumbnails = useRef<(HTMLButtonElement | null)[]>([]);
  const opener = useRef(0);

  return (
    <>
      <ul
        className={cx(
          "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-10 3xl:gap-12.5",
          className,
        )}
      >
        {images.map((image, i) => (
          <li key={`${image.src}-${i}`}>
            <button
              ref={(el) => {
                thumbnails.current[i] = el;
              }}
              type="button"
              aria-haspopup="dialog"
              aria-label={openLabels[i]}
              onClick={() => {
                opener.current = i;
                setIndex(i);
              }}
              data-visual-mask
              className="group relative block h-83.75 w-full cursor-zoom-in overflow-hidden rounded-2xl bg-dark-15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-70 lg:h-102.25 3xl:h-129.75 3xl:rounded-20"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
              />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox
        images={images}
        index={index}
        onIndexChange={setIndex}
        onClose={() => {
          setIndex(null);
          thumbnails.current[opener.current]?.focus();
        }}
        {...lightbox}
      />
    </>
  );
}
