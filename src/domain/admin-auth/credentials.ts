import { err, ok, type Result } from "@/shared/result";

/** 로그인 폼에서 온 이메일과 비밀번호 */
export type CredentialsInput = { email: string; password: string };

export type Credentials = {
  readonly email: string;
  readonly password: string;
};

// 인증 서비스에 보내기 전에 거르는 한도. 이메일은 문의와 같은 254자,
// 비밀번호는 Supabase(bcrypt)가 72바이트까지만 보지만 긴 암호문을 막지 않도록 넉넉히 둔다
export const credentialLimits = { email: 254, password: 1024 } as const;

export type CredentialsError =
  /** 이메일이나 비밀번호가 비었다 */
  | { type: "MissingCredentials" }
  /** 한도를 넘었다. 인증 서비스에 보내지 않는다 */
  | { type: "MalformedCredentials" };

// 로그인 입력 정리: 이메일은 앞뒤 공백만 뺀다 (대소문자는 인증 서비스가 맞춘다).
// 비밀번호는 공백도 비밀번호의 일부라 그대로 둔다. 공백만 있는 비밀번호는 빈 값으로 본다
export function parseCredentials(
  input: CredentialsInput,
): Result<Credentials, CredentialsError> {
  const email = input.email.trim();
  const { password } = input;
  if (email === "" || password.trim() === "")
    return err({ type: "MissingCredentials" });
  if (
    Array.from(email).length > credentialLimits.email ||
    Array.from(password).length > credentialLimits.password
  )
    return err({ type: "MalformedCredentials" });
  return ok({ email, password });
}
