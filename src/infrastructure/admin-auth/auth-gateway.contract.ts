import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AuthGateway } from "@/application/admin-auth/auth-gateway";
import { createTestCookieJar, type CookieJar } from "./cookie-jar";

// AuthGateway 계약 테스트. 구현마다 *.test.ts 에서 불러 같은 시나리오를 돌린다:
//   describeAuthGatewayContract("인메모리", async (accounts) => { ... return { gateway, dispose } });
// setup 은 accounts 를 만든 인증 서비스를 돌려준다. gateway(jar) 는 "그 쿠키로 들어온 요청 하나" 다.
// 같은 jar 로 gateway 를 다시 만들면 같은 브라우저의 다음 요청이다
export type ContractAccount = {
  email: string;
  password: string;
  role: string;
};

export type AuthHarness = {
  gateway(jar: CookieJar): AuthGateway;
  /** 만든 계정 지우기 (Supabase) */
  dispose?(): Promise<void>;
};

export function describeAuthGatewayContract(
  name: string,
  setup: (accounts: readonly ContractAccount[]) => Promise<AuthHarness>,
) {
  describe(`AuthGateway 계약: ${name}`, () => {
    // 같은 클라우드 프로젝트에서 여러 번 돌아도 겹치지 않게 실행마다 다른 이메일
    const run = Math.random().toString(36).slice(2, 10);
    const admin: ContractAccount = {
      email: `contract-admin-${run}@example.com`,
      password: `admin-${run}-Passw0rd!`,
      role: "admin",
    };
    const editor: ContractAccount = {
      email: `contract-editor-${run}@example.com`,
      password: `editor-${run}-Passw0rd!`,
      role: "editor",
    };
    let harness: AuthHarness;

    beforeAll(async () => {
      harness = await setup([admin, editor]);
    });
    afterAll(async () => {
      await harness?.dispose?.();
    });

    const signedIn = async (account: ContractAccount) => {
      const browser = createTestCookieJar();
      const user = await harness.gateway(browser.jar).signInWithPassword({
        email: account.email,
        password: account.password,
      });
      return { ...browser, user };
    };

    it("비밀번호가 맞으면 사용자(역할 포함)를 돌려주고 쿠키에 세션을 남긴다", async () => {
      const { user, snapshot } = await signedIn(admin);
      expect(user).toEqual({
        id: expect.any(String),
        email: admin.email,
        role: "admin",
      });
      expect(snapshot()).not.toEqual([]);
    });

    it("다음 요청(같은 쿠키)의 currentUser 는 같은 사용자", async () => {
      const { user, jar } = await signedIn(admin);
      expect(await harness.gateway(jar).currentUser()).toEqual(user);
    });

    it("관리자가 아닌 계정은 그 역할 그대로 (판정은 domain 이 한다)", async () => {
      const { user } = await signedIn(editor);
      expect(user).toMatchObject({ email: editor.email, role: "editor" });
    });

    it("틀린 비밀번호와 없는 이메일은 null, 세션 쿠키도 없다", async () => {
      for (const credentials of [
        { email: admin.email, password: `${admin.password}x` },
        { email: `nobody-${run}@example.com`, password: admin.password },
      ]) {
        const { jar, snapshot } = createTestCookieJar();
        const gateway = harness.gateway(jar);
        expect(await gateway.signInWithPassword(credentials)).toBeNull();
        expect(await gateway.currentUser()).toBeNull();
        expect(snapshot()).toEqual([]);
      }
    });

    it("쿠키가 없으면 currentUser 는 null, signOut 은 성공", async () => {
      const gateway = harness.gateway(createTestCookieJar().jar);
      expect(await gateway.currentUser()).toBeNull();
      await expect(gateway.signOut()).resolves.toBeUndefined();
    });

    it("다른 브라우저(다른 쿠키)와 세션을 나누지 않는다", async () => {
      await signedIn(admin);
      expect(
        await harness.gateway(createTestCookieJar().jar).currentUser(),
      ).toBeNull();
    });

    it("값을 바꾼 쿠키는 세션이 아니다", async () => {
      const { snapshot } = await signedIn(admin);
      const forged = createTestCookieJar(
        snapshot().map(({ name }) => ({ name, value: "forged" })),
      );
      expect(await harness.gateway(forged.jar).currentUser()).toBeNull();
    });

    it("signOut 뒤에는 쿠키가 지워지고, 미리 복사해 둔 쿠키로도 세션이 없다", async () => {
      const { jar, snapshot } = await signedIn(admin);
      const copied = createTestCookieJar(snapshot());
      await harness.gateway(jar).signOut();
      expect(snapshot()).toEqual([]);
      expect(await harness.gateway(jar).currentUser()).toBeNull();
      expect(await harness.gateway(copied.jar).currentUser()).toBeNull();
    });

    it("한 기기의 signOut 은 다른 기기의 세션을 끝내지 않는다", async () => {
      const phone = await signedIn(admin);
      const laptop = await signedIn(admin);
      await harness.gateway(phone.jar).signOut();
      expect(await harness.gateway(laptop.jar).currentUser()).toEqual(
        laptop.user,
      );
    });
  });
}
