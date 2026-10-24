import { z } from "zod";
import { err, ok, type Result } from "@/shared/result";

// 로그인 폼 칸 이름. FormData 의 name 과 화면이 같이 쓴다
export const loginFieldNames = ["email", "password"] as const;
export type LoginFieldName = (typeof loginFieldNames)[number];

// FormData 의 형태(칸이 문자열인지, 빠진 칸은 빈 값)만 본다. 빈 값, 한도는 domain(parseCredentials) 이 본다.
// 이메일만 NFC 로 맞춘다. 비밀번호는 사용자가 친 그대로 보낸다 (정규화하면 가입 때와 다른 바이트가 될 수 있다)
const text = z.string().default("");

export const loginFormSchema = z.object({
  email: text.transform((value) => value.normalize("NFC")),
  password: text,
});

export type LoginForm = z.infer<typeof loginFormSchema>;

/** 칸에 파일이 오는 것처럼 폼으로 만들 수 없는 요청 */
export type MalformedLoginForm = { type: "MalformedForm" };

export function parseLoginForm(
  formData: FormData,
): Result<LoginForm, MalformedLoginForm> {
  const raw = Object.fromEntries(
    loginFieldNames.map((name) => [name, formData.get(name) ?? undefined]),
  );
  const parsed = loginFormSchema.safeParse(raw);
  return parsed.success ? ok(parsed.data) : err({ type: "MalformedForm" });
}
