// 푸터 저작권 연도. cacheComponents 에서는 렌더 중 new Date() 가 프리렌더를 막으므로 캐시된 값으로 받는다
export async function getCopyrightYear() {
  "use cache";
  return new Date().getFullYear();
}
