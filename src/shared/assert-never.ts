// switch 의 default 에서 호출해, 판별 유니온에 케이스가 추가되면 컴파일 에러가 나게 한다
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
