import "server-only";
import type { Notifier } from "@/application/inquiry/notifier";
import { buildInquiryEmail } from "./inquiry-email";

export type ResendEnv = { apiKey: string; to: string; from: string };

type Env = Readonly<Record<string, string | undefined>>;

// 도메인을 붙이기 전에는 Resend 의 테스트 발신 주소만 쓸 수 있다 (수신은 Resend 계정 주인 주소로만 된다)
export const DEFAULT_INQUIRY_FROM = "Machum Studio <onboarding@resend.dev>";

// 새 문의 메일 설정. 키나 받는 주소가 없거나 DATA_STORE=memory(e2e) 면 null (로그 알림으로 동작, 실제로 보내지 않는다).
// 키는 발송 전용 권한으로 만든다. NEXT_PUBLIC_ 이 붙지 않은 이름으로만 읽는다
export function readResendEnv(env: Env = process.env): ResendEnv | null {
  if (env.DATA_STORE === "memory") return null;
  const apiKey = env.RESEND_API_KEY?.trim();
  const to = env.INQUIRY_NOTIFY_EMAIL?.trim();
  if (!apiKey || !to) return null;
  return {
    apiKey,
    to,
    from: env.INQUIRY_FROM_EMAIL?.trim() || DEFAULT_INQUIRY_FROM,
  };
}

const ENDPOINT = "https://api.resend.com/emails";

type Options = {
  fetch?: typeof fetch;
  /** 메일이 느려도 문의 제출 응답이 오래 걸리지 않게 끊는다. 끊기면 NotificationFailed 경고 (docs/adr/0007) */
  timeoutMs?: number;
};

// Resend 가 돌려준 에러 이름만 꺼낸다. 메시지에는 받는 주소가 들어 있을 수 있어 쓰지 않는다
async function errorName(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "name" in body)
      return typeof body.name === "string" ? body.name : null;
  } catch {
    // 본문이 JSON 이 아니면 상태 코드만 쓴다
  }
  return null;
}

// Resend 이메일로 새 문의를 관리자에게 알린다. SDK 대신 REST API 를 fetch 로 부른다 (의존성 없이 타임아웃과 테스트를 다루기 쉽다).
// 실패(네트워크, 4xx/5xx, 한도 429, 타임아웃)는 던지고, 유스케이스가 경고로 바꾼다.
// 에러 메시지에는 키, 주소, 문의 내용을 넣지 않는다 (서버 로그에 그대로 찍힌다)
export function createResendNotifier(
  { apiKey, to, from }: ResendEnv,
  { fetch: fetchImpl = fetch, timeoutMs = 5000 }: Options = {},
): Notifier {
  return {
    notifyNewInquiry: async (inquiry) => {
      const { subject, html, text } = buildInquiryEmail(inquiry);
      let response: Response;
      try {
        response = await fetchImpl(ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            // 같은 문의를 다시 보내도 메일은 한 통 (Resend 가 24시간 동안 같은 키를 무시한다)
            "Idempotency-Key": `inquiry-${inquiry.id}`,
          },
          body: JSON.stringify({
            from,
            to: [to],
            reply_to: inquiry.email,
            subject,
            html,
            text,
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (cause) {
        const timedOut =
          cause instanceof Error &&
          (cause.name === "TimeoutError" || cause.name === "AbortError");
        throw new Error(
          timedOut
            ? `[resend] ${timeoutMs}ms 안에 응답이 없어 발송을 포기했다`
            : "[resend] 요청을 보내지 못했다 (네트워크)",
          { cause },
        );
      }
      if (response.ok) return;

      const name = await errorName(response);
      const reason = response.status === 429 ? " 발송 한도 또는 속도 제한" : "";
      throw new Error(
        `[resend] 발송 실패 (${response.status}${name ? ` ${name}` : ""})${reason}`,
      );
    },
  };
}
