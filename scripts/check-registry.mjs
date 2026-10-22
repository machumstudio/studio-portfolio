#!/usr/bin/env node
// pnpm-lock.yaml 과 .npmrc 에 허용 목록 밖의 레지스트리/tarball 주소가 있으면 실패한다.
// 전역 npm 설정의 레지스트리 주소가 lockfile 에 기록되어 공개 레포에 올라가는 것을 막는다.
// 사용: node scripts/check-registry.mjs (pre-commit, CI 에서 실행)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const ALLOWED_ORIGINS = ["https://registry.npmjs.org"];

const isAllowed = (raw) => {
  try {
    return ALLOWED_ORIGINS.includes(new URL(raw).origin);
  } catch {
    return false;
  }
};

// lockfile: 레지스트리 주소는 resolution 의 tarball 필드로만 기록된다. 그 값만 본다
// (deprecation 안내문의 URL, language-subtag-registry 같은 패키지 이름은 무시)
export function checkLockfile(text) {
  const errors = [];
  text.split("\n").forEach((line, i) => {
    for (const m of line.matchAll(/(?<![\w-])(tarball):\s*([^\s,}]+)/g)) {
      if (!isAllowed(m[2]))
        errors.push(`pnpm-lock.yaml:${i + 1} ${m[1]}: ${m[2]}`);
    }
  });
  return errors;
}

// .npmrc: registry= 가 반드시 허용 주소여야 하고, 다른 레지스트리 설정(@scope:registry=, //host/:_authToken 등)은 허용 목록 안에서만
export function checkNpmrc(text) {
  const errors = [];
  let hasRegistry = false;
  text.split("\n").forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) return;
    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=").trim();
    const where = `.npmrc:${i + 1}`;
    if (key.trim() === "registry") {
      hasRegistry = true;
      if (!isAllowed(value)) errors.push(`${where} registry: ${value}`);
    } else if (/registry$/.test(key.trim())) {
      if (!isAllowed(value)) errors.push(`${where} ${key.trim()}: ${value}`);
    } else if (key.startsWith("//")) {
      // //host/path/:_authToken=... 형식은 해당 레지스트리용 설정
      if (!isAllowed(`https:${key.split(":")[0]}`))
        errors.push(`${where} ${key.split(":")[0]}`);
    }
  });
  if (!hasRegistry) {
    errors.push(
      ".npmrc: registry= 가 없다 (전역 설정의 레지스트리가 쓰일 수 있다)",
    );
  }
  return errors;
}

function main() {
  const read = (path) => {
    try {
      return readFileSync(path, "utf8");
    } catch {
      return null;
    }
  };
  const lock = read("pnpm-lock.yaml");
  const npmrc = read(".npmrc");
  const errors = [
    ...(lock === null
      ? ["pnpm-lock.yaml 을 읽을 수 없다"]
      : checkLockfile(lock)),
    ...(npmrc === null
      ? [".npmrc 가 없다 (전역 설정의 레지스트리가 쓰일 수 있다)"]
      : checkNpmrc(npmrc)),
  ];
  if (errors.length > 0) {
    console.error(
      `허용되지 않은 레지스트리 주소 (허용: ${ALLOWED_ORIGINS.join(", ")})`,
    );
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }
  console.log(`check-registry: ok (${ALLOWED_ORIGINS.join(", ")})`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
