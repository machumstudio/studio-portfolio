import localFont from "next/font/local";
// 한글 대체 글꼴: Pretendard 가변 다이나믹 서브셋(저자 배포본, OFL).
// unicode-range 로 92조각에 나뉘어 있어 페이지에 있는 글자의 조각만 받는다 (font-family "Pretendard Variable").
// 직접 서브셋을 만들면 OFL 예약 글꼴 이름 조항 때문에 이름을 바꿔야 해서 배포본을 그대로 쓴다.
// 비용(한국어 첫 방문 약 440KB, 모바일 Lighthouse 점수 흔들림)을 알고 OS 와 상관없는 같은 모양을 택했다 (docs/adr/0017).
// Manrope 는 레포 안 라틴 서브셋 가변 파일 1개(약 24KB), next/font 가 응답 Link 헤더로 미리 받는다.
// next/font/google 은 빌드가 Google Fonts 응답에 기대서 운영 빌드가 깨진 적이 있어 레포에 둔다
// (docs/adr/0023, 출처와 만드는 법은 src/assets/fonts/manrope/README.md)
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";

export const manrope = localFont({
  src: "../assets/fonts/manrope/Manrope-Latin-Variable.woff2",
  weight: "200 800",
  variable: "--font-manrope",
  display: "swap",
});
