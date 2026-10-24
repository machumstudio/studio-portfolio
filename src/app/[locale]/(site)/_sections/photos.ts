// 페이지 고정 사진 (public/images/, 출처는 docs/design/photos.md). alt 는 Photos.<key> 메시지.
// 작업 사진은 시드/DB 에서 온다 (src/infrastructure/works/seed.ts)
export const pagePhotos = {
  homeAbout: "/images/pages/home-about.jpg",
  aboutHero: "/images/pages/about-hero.jpg",
  portfolioHero: "/images/pages/portfolio-hero.jpg",
  servicesHero: "/images/pages/services-hero.jpg",
  contactHero: "/images/pages/contact-hero.jpg",
} as const;

// 서비스 소개 슬라이더 (Services 페이지는 3장씩, 홈 서비스 슬라이더는 첫 장)
export const servicePhotoIds = ["1", "2", "3"] as const;
export const servicePhoto = (service: string, id: string) =>
  `/images/services/${service}-${id}.jpg`;

// 홈 히어로 콜라주 7칸 (칸 순서 = DOM 순서). 새 파일 없이 작업의 두 번째 사진을 다시 쓴다.
// 히어로 제목 옆을 채우는 꾸밈 모자이크라 alt 는 비운다 (같은 사진은 작업 상세에서 설명과 함께 나온다)
export const heroCollage = [
  "faces-of-resilience",
  "innocence-unveiled",
  "a-wedding-tale",
  "festival-of-colors",
  "brand-storytelling",
  "elegance-in-monochrome",
  "culinary-delights",
].map((slug) => ({ src: `/images/works/${slug}-2.jpg`, alt: "" }));
