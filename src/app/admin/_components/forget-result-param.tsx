"use client";

import { useEffect } from "react";

// 결과 알림 주소(?notice=, ?deleted=1, ?created=1)를 한 번 보여 준 뒤 주소창에서만 지운다.
// 관리자 화면의 결과는 폼 POST → redirect 로 주소에 실려 오고(docs/adr/0013, 0016), JS 가 없어도 결과 화면이 보인다.
// JS 가 있으면 화면은 그대로 두고 주소만 바꿔서, 새로 고치거나 주소를 복사해도 같은 알림이 다시 나오지 않는다.
// JS 가 없으면 지금처럼 주소에 남는다 (docs/adr/0020).
// history.replaceState 는 Next 라우터와 이어져 있어 화면을 다시 불러오지 않는다.
// 같은 화면에서 결과가 이어서 오면(확인 → 완료) 이 컴포넌트는 그대로 남아 다시 그려지기만 하므로, 그릴 때마다 주소를 본다
export function ForgetResultParam({ name }: { name: string }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(name)) return;
    url.searchParams.delete(name);
    window.history.replaceState(null, "", url);
  });
  return null;
}
