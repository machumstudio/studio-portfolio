// @vitest-environment node
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

// scripts/e2e-needed.sh 를 임시 git 저장소에서 돌린다 (CI e2e 잡이 단계를 건너뛸지 정하는 스크립트)
const script = fileURLToPath(new URL("./e2e-needed.sh", import.meta.url));
const repos = [];

const git = (cwd, ...args) =>
  execFileSync(
    "git",
    ["-c", "user.name=test", "-c", "user.email=test@example.com", ...args],
    { cwd, encoding: "utf8" },
  ).trim();

/** 빈 커밋(base) 위에 files 를 더한 커밋(head)을 만든다 */
const repoWith = (files) => {
  const cwd = mkdtempSync(join(tmpdir(), "e2e-needed-"));
  repos.push(cwd);
  git(cwd, "init", "-q");
  git(cwd, "commit", "-q", "--allow-empty", "-m", "base");
  for (const file of files) {
    mkdirSync(join(cwd, file, ".."), { recursive: true });
    writeFileSync(join(cwd, file), "x\n");
  }
  git(cwd, "add", ".");
  git(cwd, "commit", "-q", "-m", "head");
  return { cwd, base: git(cwd, "rev-parse", "HEAD~1") };
};

const run = ({ cwd, base }) =>
  spawnSync("bash", [script, base, "HEAD"], { cwd, encoding: "utf8" });

afterEach(() => {
  for (const cwd of repos.splice(0)) rmSync(cwd, { recursive: true });
});

describe("e2e-needed.sh", () => {
  it("문서만 바뀌면 run=false", () => {
    const result = run(repoWith(["docs/ops-manual.md", "README.md"]));
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("run=false\n");
  });

  it("문서 밖 파일이 하나라도 바뀌면 run=true", () => {
    const result = run(repoWith(["docs/a.md", "src/app/page.tsx"]));
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("run=true\n");
  });

  it("base 커밋을 모르면 run=true", () => {
    const repo = repoWith(["docs/a.md"]);
    const result = run({ ...repo, base: "0".repeat(40) });
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("run=true\n");
  });

  it("바뀐 파일이 많아도(SIGPIPE 없이) run= 을 쓰고 앞 20개만 보여 준다", () => {
    const files = Array.from(
      { length: 3000 },
      (_, i) => `src/generated/a-fairly-long-file-name-${i}.ts`,
    );
    const result = run(repoWith(files));
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("run=true\n");
    expect(result.stderr).toContain("외 2980개");
  });
});
