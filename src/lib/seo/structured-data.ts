import { localizedPath, type Locale } from "./alternates";
import { siteName } from "./metadata";

// schema.org 구조화 데이터(JSON-LD). 검색 결과에 스튜디오 이름/연락처와 작업 정보를 알린다.
// 넣는 것은 두 곳뿐이다: 홈(스튜디오 Organization + WebSite)과 작업 상세(CreativeWork).
// - LocalBusiness 는 주소가 필수라 쓰지 않는다 (가상 스튜디오라 실제 주소가 없다)
// - sameAs(SNS)는 푸터 링크가 각 서비스 첫 화면이라 넣지 않는다
// - BreadcrumbList 는 깊이가 2단(목록 → 상세)이라 얻는 것이 적어 넣지 않는다

type JsonLdObject = { [key: string]: unknown };

const organizationId = (siteUrl: string) => `${siteUrl}/#organization`;

const absolute = (siteUrl: string, src: string) => new URL(src, siteUrl).href;

/** 홈: 스튜디오와 사이트. 연락처는 가상 스튜디오의 예시값 (studio-contact.ts) */
export function studioJsonLd({
  siteUrl,
  locale,
  description,
  contact,
}: {
  siteUrl: string;
  locale: Locale;
  description: string;
  contact: { email: string; phone: string };
}): JsonLdObject {
  const home = absolute(siteUrl, localizedPath(locale, "/"));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId(siteUrl),
        name: siteName,
        url: absolute(siteUrl, "/"),
        description,
        email: contact.email,
        telephone: contact.phone,
      },
      {
        "@type": "WebSite",
        "@id": `${home}#website`,
        name: siteName,
        url: home,
        inLanguage: locale,
        publisher: { "@id": organizationId(siteUrl) },
      },
    ],
  };
}

/** 작업 상세: 제목, 설명, 촬영 연월, 분야, 사진(대표가 먼저), 만든 곳 */
export function workJsonLd({
  siteUrl,
  locale,
  slug,
  title,
  description,
  date,
  genre,
  images,
}: {
  siteUrl: string;
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  /** YYYY-MM */
  date: string;
  genre: string;
  /** 대표 사진이 첫 번째 */
  images: readonly string[];
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": absolute(siteUrl, localizedPath(locale, `/work/${slug}`)),
    url: absolute(siteUrl, localizedPath(locale, `/work/${slug}`)),
    name: title,
    description,
    dateCreated: date,
    genre,
    inLanguage: locale,
    image: images.map((src) => absolute(siteUrl, src)),
    creator: {
      "@type": "Organization",
      "@id": organizationId(siteUrl),
      name: siteName,
    },
  };
}

/**
 * <script type="application/ld+json"> 안에 넣을 문자열. "<" 를 이스케이프해서
 * 작업 제목 같은 데이터에 "</script>" 가 들어 있어도 태그가 닫히지 않게 한다 (Next 문서의 방법)
 */
export const serializeJsonLd = (data: JsonLdObject) =>
  JSON.stringify(data).replace(/</g, "\\u003c");
