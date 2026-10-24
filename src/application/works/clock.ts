// 지금 시각. 테스트에서 고정한다
export type Clock = {
  now(): Date;
};

// 새 작업 id, 사진 파일 이름. 추측할 수 없는 값이어야 한다 (공개 버킷 주소에 들어간다, docs/adr/0014)
export type IdGenerator = {
  next(): string;
};
