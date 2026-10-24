import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./client";
import type { Database } from "./database";

// 계약/RLS 테스트(*.contract.test.ts)와 그 globalSetup 에서만 쓴다.
// DATA_STORE=memory 와 상관없이 env 값만 본다 (값이 없으면 테스트를 건너뛴다)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

export const hasSupabaseEnv = Boolean(url && secretKey && publishableKey);

const required = (value: string | undefined) => {
  if (!value)
    throw new Error("Supabase env 가 없다 (hasSupabaseEnv 로 건너뛴다)");
  return value;
};

export const secretClient = () =>
  createSupabaseServerClient({
    url: required(url),
    secretKey: required(secretKey),
  });

export const publishableEnv = () => ({
  url: required(url),
  publishableKey: required(publishableKey),
});

// 브라우저와 같은 권한: publishable 키 = anon 역할. RLS 를 그대로 받는다
export const publishableClient = () =>
  createClient<Database>(required(url), required(publishableKey), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
