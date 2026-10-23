import { Sparkle } from "lucide-react";

// 큰 사진을 글/장식 자리만큼 깎은 BOOLEAN 모양(Portfolio, About 히어로)을 만드는 조각들.
// 깎인 자리는 배경색 칸이 사진 위에 올라앉아 만든다. 칸의 안쪽 모서리는 radius 34,
// 칸 옆 사진 모서리는 photo-corner-* 조각으로 둥글게 덮는다.

/** 사진 모서리 조각(꾸밈). className 에 photo-corner-* 와 위치를 준다 */
export const PhotoCutCorner = ({ className }: { className: string }) => (
  <span aria-hidden className={className} />
);

/** 사진이 보이는 사각형. 시각 비교에서 가린다 (안 보이는 크기에서는 display:none 이라 크기 0) */
export const PhotoArea = ({ className }: { className: string }) => (
  <span aria-hidden data-visual-mask className={className} />
);

// 사진 아래 줄 (lg 부터, 높이 136/173): 왼쪽 별 원(100/137, pad 18 32 18 20) /
// 오른쪽 아래로 내려 보라는 안내(폭 164/205, 14/18 Medium Grey/50, pad 왼쪽 70/62 오른쪽 20/50).
// 수치: docs/design/nodes/{portfolio,about}-*.json 의 큰 사진 "Container" > "Sub Container" (두 페이지 같다)
export function PhotoCutFooter({ scrollLabel }: { scrollLabel: string }) {
  return (
    <div className="hidden lg:flex lg:h-34 3xl:h-43.25">
      <div className="relative flex items-center rounded-tr-34 bg-dark-03 pr-8 pl-5">
        <span
          aria-hidden
          className="flex size-25 items-center justify-center rounded-full border border-dark-20 3xl:size-34.25"
        >
          <Sparkle
            className="size-16.5 fill-dark-20 text-dark-20 3xl:size-22.5"
            strokeWidth={0}
          />
        </span>
        <PhotoCutCorner className="absolute bottom-full left-0 photo-corner-bl" />
        <PhotoCutCorner className="absolute bottom-0 left-full photo-corner-bl" />
      </div>
      <PhotoArea className="flex-1" />
      <div className="relative flex items-center rounded-tl-34 bg-dark-03 pr-5 pl-17.5 3xl:pr-12.5 3xl:pl-15.5">
        <p className="w-41 text-caption font-medium text-grey-50 uppercase 3xl:w-51.25">
          {scrollLabel}
        </p>
        <PhotoCutCorner className="absolute right-0 bottom-full photo-corner-br" />
        <PhotoCutCorner className="absolute right-full bottom-0 photo-corner-br" />
      </div>
    </div>
  );
}
