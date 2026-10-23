import { notFound } from "next/navigation";

// (site) 의 어떤 경로에도 맞지 않는 주소 (/없는-주소, /en/없는-주소).
// 최상위 레이아웃이 [locale] 이라 그냥 두면 Next 기본 404 가 사이트 틀 없이 나온다.
// 여기서 notFound() 를 불러 (site)/not-found.tsx 를 헤더/푸터 안에 보여 준다
export default function CatchAll() {
  notFound();
}
