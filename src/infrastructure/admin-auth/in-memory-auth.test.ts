import { describe, expect, it } from "vitest";
import { describeAuthGatewayContract } from "./auth-gateway.contract";
import { createTestCookieJar } from "./cookie-jar";
import { createInMemoryAuth, memorySessionCookie } from "./in-memory-auth";
import { memoryAccounts } from "./memory-accounts";

describeAuthGatewayContract("인메모리", async (accounts) =>
  createInMemoryAuth(
    accounts.map((account, i) => ({ ...account, id: `contract-${i}` })),
  ),
);

describe("인메모리 인증", () => {
  it("세션 쿠키는 /admin 에만, httpOnly", async () => {
    const set: unknown[] = [];
    const { jar } = createTestCookieJar();
    await createInMemoryAuth(memoryAccounts)
      .gateway({ ...jar, setAll: (cookies) => set.push(...cookies) })
      .signInWithPassword({
        email: "admin@example.com",
        password: "memory-admin-password",
      });
    expect(set).toEqual([
      {
        name: memorySessionCookie,
        value: expect.stringMatching(/^[0-9a-f-]{36}$/),
        options: expect.objectContaining({ path: "/admin", httpOnly: true }),
      },
    ]);
  });

  it("e2e 테스트 계정: 관리자 1개, 관리자가 아닌 계정 1개", () => {
    expect(memoryAccounts.map((a) => a.role)).toEqual(["admin", "editor"]);
  });
});
