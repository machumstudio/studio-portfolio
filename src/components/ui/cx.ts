import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// globals.css 의 @utility text-* (글자 크기 + 굵기 + 행간 묶음).
// tailwind-merge 는 모르는 text-* 를 글자 색으로 보기 때문에 등록하지 않으면
// "text-body text-grey-70" 에서 앞의 것이 지워진다
const textSizes = [
  "display",
  "price",
  "h1",
  "h2",
  "h3",
  "h4",
  "card",
  "title",
  "category",
  "package",
  "quote",
  "tagline",
  "lead",
  "body",
  "eyebrow",
  "button",
  "field",
  "label",
  "caption",
  "logo",
  "wordmark",
];

const merge = extendTailwindMerge<"page-x" | "surface">({
  extend: {
    theme: { radius: ["10", "14", "20", "24", "30", "34", "100", "photo-cut"] },
    classGroups: {
      "font-size": [{ text: textSizes }],
      // page-x: 좌우 padding-inline. px/ps/pe/pl/pr 와 같은 속성이다
      "page-x": ["page-x"],
      // surface-raised: 채우기 + 그라디언트 테두리. 다른 border/bg 클래스와 따로 산다
      surface: ["surface-raised"],
    },
    conflictingClassGroups: {
      "page-x": ["px", "ps", "pe", "pl", "pr"],
      p: ["page-x"],
      px: ["page-x"],
    },
  },
});

// className 조합. 거짓 값은 버리고, Tailwind 클래스가 겹치면 뒤쪽이 이긴다
// (예: buttonStyles 기본값 위에 사용처 className 으로 크기를 덮어쓴다)
export const cx = (...classes: ClassValue[]) => merge(clsx(classes));
