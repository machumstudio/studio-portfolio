#!/usr/bin/env node
// 브라우저로 가는 빌드 결과물에 서버 전용 비밀이 들어갔는지 검사한다. pnpm build 다음에 실행한다.
// 사용: pnpm check:bundle (로컬은 .env.local 의 실제 값까지 찾고, CI 는 이름과 접두사만 찾는다)
// - .next/static: 클라이언트 JS/CSS. 비밀 값, sb_secret_ 접두사, 서버 전용 변수 이름이 있으면 실패
//   (이름이 있으면 서버 코드가 클라이언트 번들로 끌려 들어간 것이다)
// - .next/server 의 .html/.rsc: 미리 만든 HTML 과 RSC 페이로드. 비밀 값과 접두사만 본다
// 찾은 값은 출력하지 않는다. 어떤 변수가 어느 파일에 있는지만 알린다
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const SERVER_ONLY_ENV = [
  "SUPABASE_SECRET_KEY",
  "SUPABASE_DB_URL",
  "RESEND_API_KEY",
  "INQUIRY_NOTIFY_EMAIL",
];
const SECRET_KEY_PREFIX = "sb_secret_";

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));

// files: [{ path, text, client }] → 위반 목록
export function findLeaks(files, env) {
  const values = SERVER_ONLY_ENV.flatMap((name) => {
    const value = env[name]?.trim();
    return value ? [{ name, value }] : [];
  });
  const leaks = [];
  for (const { path, text, client } of files) {
    for (const { name, value } of values)
      if (text.includes(value)) leaks.push(`${path}: ${name} 의 값`);
    if (text.includes(SECRET_KEY_PREFIX))
      leaks.push(`${path}: secret 키 접두사 ${SECRET_KEY_PREFIX}`);
    if (client)
      for (const name of SERVER_ONLY_ENV)
        if (text.includes(name))
          leaks.push(`${path}: 서버 전용 변수 이름 ${name}`);
  }
  return leaks;
}

function main() {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const next = join(root, ".next");
  const read = (path, client) => ({
    path: relative(root, path),
    text: readFileSync(path, "utf8"),
    client,
  });
  const files = [
    ...walk(join(next, "static")).map((path) => read(path, true)),
    ...walk(join(next, "server"))
      .filter((path) => /\.(html|rsc)$/.test(path))
      .map((path) => read(path, false)),
  ];
  const leaks = findLeaks(files, process.env);
  const checkedValues = SERVER_ONLY_ENV.filter((name) => process.env[name]);
  if (leaks.length) {
    console.error(
      `check-client-bundle: 서버 전용 비밀이 브라우저로 가는 파일에 있다\n${leaks.join("\n")}`,
    );
    process.exit(1);
  }
  console.info(
    `check-client-bundle: ok (${files.length}개 파일, 값 검사: ${checkedValues.join(", ") || "없음(이름/접두사만)"})`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
