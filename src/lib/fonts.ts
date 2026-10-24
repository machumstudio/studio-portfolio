import { Manrope } from "next/font/google";

// 영문 글꼴은 Manrope 하나 (라틴 서브셋 약 24KB, next/font 가 응답 Link 헤더로 미리 받는다).
// 한글 웹 글꼴(Pretendard)은 20칸에서 뺐다: 한국어 홈이 약 440KB 를 받아 모바일 성능이 흔들렸다.
// 한글은 OS 글꼴로 그린다 (globals.css --font-sans, docs/adr/0017)

export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});
