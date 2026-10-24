import { describe } from "vitest";
import {
  hasSupabaseEnv,
  publishableEnv,
  secretClient,
} from "../supabase/contract-support";
import { describeAuthGatewayContract } from "./auth-gateway.contract";
import { createSupabaseAuthGateway } from "./supabase-auth-gateway";

// 클라우드 Auth 에 실행마다 다른 임시 계정을 만들고(공개 가입이 꺼져 있어 secret 키의 admin API 로),
// 끝나면 지운다. 실제 관리자 계정은 쓰지 않는다
describe.skipIf(!hasSupabaseEnv)("Supabase", () => {
  describeAuthGatewayContract("Supabase 쿠키 세션", async (accounts) => {
    const admin = secretClient().auth.admin;
    const ids: string[] = [];
    for (const { email, password, role } of accounts) {
      const { data, error } = await admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role },
      });
      if (error) throw error;
      ids.push(data.user.id);
    }
    return {
      gateway: (jar) =>
        createSupabaseAuthGateway(
          { ...publishableEnv(), secureCookies: true },
          jar,
        ),
      dispose: async () => {
        for (const id of ids) await admin.deleteUser(id);
      },
    };
  });
});
