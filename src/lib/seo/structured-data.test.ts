import { describe, expect, it } from "vitest";
import { serializeJsonLd, studioJsonLd, workJsonLd } from "./structured-data";

const siteUrl = "https://machum.example";

describe("studioJsonLd", () => {
  it("Organization(연락처) + WebSite(언어별 홈), 같은 @id 로 잇는다", () => {
    const data = studioJsonLd({
      siteUrl,
      locale: "en",
      description: "Photo studio",
      contact: { email: "hello@example.com", phone: "+00 000000000" },
    });
    expect(data).toEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${siteUrl}/#organization`,
          name: "Machum Studio",
          url: `${siteUrl}/`,
          description: "Photo studio",
          email: "hello@example.com",
          telephone: "+00 000000000",
        },
        {
          "@type": "WebSite",
          "@id": `${siteUrl}/en#website`,
          name: "Machum Studio",
          url: `${siteUrl}/en`,
          inLanguage: "en",
          publisher: { "@id": `${siteUrl}/#organization` },
        },
      ],
    });
  });
});

describe("workJsonLd", () => {
  it("CreativeWork: 주소, 촬영 연월, 분야, 사진 절대 주소(사이트 경로와 Storage 주소), 만든 곳", () => {
    const data = workJsonLd({
      siteUrl,
      locale: "ko",
      slug: "a-wedding-tale",
      title: "어느 결혼식 이야기",
      description: "2021년 9월 이벤트 촬영",
      date: "2021-09",
      genre: "이벤트",
      images: ["/images/works/a-1.jpg", "https://cdn.example/w/2.jpg"],
    });
    expect(data).toMatchObject({
      "@type": "CreativeWork",
      url: `${siteUrl}/work/a-wedding-tale`,
      name: "어느 결혼식 이야기",
      dateCreated: "2021-09",
      genre: "이벤트",
      inLanguage: "ko",
      image: [`${siteUrl}/images/works/a-1.jpg`, "https://cdn.example/w/2.jpg"],
      creator: { "@id": `${siteUrl}/#organization`, name: "Machum Studio" },
    });
  });
});

describe("serializeJsonLd", () => {
  it("데이터 속 </script> 가 태그를 닫지 못하게 < 를 이스케이프한다", () => {
    const text = serializeJsonLd({ name: "</script><script>alert(1)" });
    expect(text).not.toContain("<");
    expect(JSON.parse(text)).toEqual({ name: "</script><script>alert(1)" });
  });
});
