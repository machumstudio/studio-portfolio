import { describe, expect, it } from "vitest";
import { checkLockfile, checkNpmrc } from "./check-registry.mjs";

const OTHER = "https://npm.internal.example/api/npm/";

describe("checkLockfile", () => {
  it("tarball 필드가 없는 공개 npm lockfile 은 통과한다", () => {
    const lock = [
      "  foo@1.0.0:",
      "    resolution: {integrity: sha512-abc==}",
      "    deprecated: See https://eslint.org/version-support",
      "      language-subtag-registry: 0.3.23",
      "  x-tarball@1.0.0: {}",
    ].join("\n");
    expect(checkLockfile(lock)).toEqual([]);
  });

  it("공개 npm tarball 은 통과한다", () => {
    const lock =
      "    resolution: {integrity: sha512-abc==, tarball: https://registry.npmjs.org/foo/-/foo-1.0.0.tgz}";
    expect(checkLockfile(lock)).toEqual([]);
  });

  it("허용 목록 밖의 tarball 은 줄 번호와 함께 실패한다", () => {
    const lock = `a:\n    resolution: {integrity: sha512-abc==, tarball: ${OTHER}foo/-/foo-1.0.0.tgz}`;
    expect(checkLockfile(lock)).toEqual([
      `pnpm-lock.yaml:2 tarball: ${OTHER}foo/-/foo-1.0.0.tgz`,
    ]);
  });

  it("포트를 붙여도 다른 호스트면 실패한다", () => {
    const lock =
      "    resolution: {tarball: https://npm.internal.example:443/foo.tgz}";
    expect(checkLockfile(lock)).toHaveLength(1);
  });
});

describe("checkNpmrc", () => {
  it("공개 npm registry 만 있으면 통과한다", () => {
    expect(
      checkNpmrc("# 주석\nregistry=https://registry.npmjs.org/\n"),
    ).toEqual([]);
  });

  it("registry= 가 없으면 실패한다", () => {
    expect(checkNpmrc("save-exact=true\n")).toHaveLength(1);
  });

  it("다른 registry, scope registry, 다른 호스트 인증 설정은 실패한다", () => {
    const npmrc = [
      `registry=${OTHER}`,
      `@acme:registry=${OTHER}`,
      "//npm.internal.example/api/npm/:_authToken=xxx",
      "//registry.npmjs.org/:_authToken=yyy",
    ].join("\n");
    expect(checkNpmrc(npmrc)).toEqual([
      `.npmrc:1 registry: ${OTHER}`,
      `.npmrc:2 @acme:registry: ${OTHER}`,
      ".npmrc:3 //npm.internal.example/api/npm/",
    ]);
  });
});
