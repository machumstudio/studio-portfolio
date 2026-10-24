// 스토리 전용 사진. 관리자 업로드(18칸)로 비율/크기가 제각각인 사진이 와도 사진 칸이 그대로인지 본다.
// 줄무늬 + 가운데 원 + 테두리라 어디가 잘렸는지(object-cover) 눈으로 알 수 있다. 앱 번들에는 들어가지 않는다.
const svg = (width: number, height: number, label: string) => {
  const r = Math.min(width, height) / 3;
  const body =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<defs><pattern id="s" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
    `<rect width="20" height="40" fill="slategray"/></pattern></defs>` +
    `<rect width="100%" height="100%" fill="dimgray"/><rect width="100%" height="100%" fill="url(#s)"/>` +
    `<circle cx="${width / 2}" cy="${height / 2}" r="${r}" fill="goldenrod"/>` +
    `<rect x="4" y="4" width="${width - 8}" height="${height - 8}" fill="none" stroke="tomato" stroke-width="8"/>` +
    `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="${r / 3}" fill="black">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(body)}`;
};

/** 아주 세로로 긴 사진 (1:4) */
export const tallPhoto = { src: svg(400, 1600, "1:4"), alt: "세로로 긴 사진" };
/** 아주 가로로 긴 사진 (4:1) */
export const widePhoto = { src: svg(1600, 400, "4:1"), alt: "가로로 긴 사진" };
/** 작은 사진 (200px) */
export const tinyPhoto = { src: svg(200, 200, "200"), alt: "작은 사진" };

/** 세 가지를 번갈아 n 장 */
export const oddPhotos = (count: number) =>
  Array.from(
    { length: count },
    (_, i) => [tallPhoto, widePhoto, tinyPhoto][i % 3]!,
  );
