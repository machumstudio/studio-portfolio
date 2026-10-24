import { serializeJsonLd } from "./structured-data";

// 구조화 데이터 <script>. 서버에서 그려 HTML 에 바로 들어간다 (클라이언트 JS 없음)
export function JsonLd({
  data,
}: {
  data: Parameters<typeof serializeJsonLd>[0];
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
