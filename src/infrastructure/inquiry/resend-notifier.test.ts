import { describe, expect, it, vi } from "vitest";
import { createInquiry, type InquiryId } from "@/domain/inquiry/inquiry";
import {
  createResendNotifier,
  DEFAULT_INQUIRY_FROM,
  readResendEnv,
} from "./resend-notifier";

vi.mock("server-only", () => ({}));

const created = createInquiry(
  {
    firstName: "하늘",
    lastName: "김",
    email: "sky@example.com",
    phone: "",
    message: "<b>가족사진</b> 문의",
  },
  {
    id: "inq-1" as InquiryId,
    receivedAt: new Date("2026-10-24T09:00:00Z"),
  },
);
if (!created.ok) throw new Error(created.error.type);
const inquiry = created.value;

const env = {
  apiKey: "re_test_key",
  to: "admin@example.com",
  from: DEFAULT_INQUIRY_FROM,
};

const respond = (status: number, body: unknown = { id: "email-1" }) =>
  vi.fn<typeof globalThis.fetch>(async () => Response.json(body, { status }));

describe("readResendEnv", () => {
  const full = {
    RESEND_API_KEY: " re_test_key ",
    INQUIRY_NOTIFY_EMAIL: "admin@example.com",
  };

  it("키와 받는 주소가 있으면 설정을 만들고, 발신 주소 기본값은 onboarding@resend.dev", () => {
    expect(readResendEnv(full)).toEqual({
      apiKey: "re_test_key",
      to: "admin@example.com",
      from: "Machum Studio <onboarding@resend.dev>",
    });
  });

  it("발신 주소는 INQUIRY_FROM_EMAIL 로 바꿀 수 있다 (도메인을 붙인 뒤)", () => {
    expect(
      readResendEnv({ ...full, INQUIRY_FROM_EMAIL: "hello@machum.studio" })
        ?.from,
    ).toBe("hello@machum.studio");
  });

  it("키나 받는 주소가 없거나 DATA_STORE=memory 면 null", () => {
    expect(readResendEnv({ ...full, RESEND_API_KEY: "" })).toBeNull();
    expect(readResendEnv({ ...full, INQUIRY_NOTIFY_EMAIL: " " })).toBeNull();
    expect(readResendEnv({ ...full, DATA_STORE: "memory" })).toBeNull();
  });
});

describe("createResendNotifier", () => {
  it("Resend API 에 키, 받는 주소, Reply-To(문의자), 제목, HTML/텍스트를 보낸다", async () => {
    const fetch = respond(200);
    await createResendNotifier(env, { fetch }).notifyNewInquiry(inquiry);

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer re_test_key",
      "Content-Type": "application/json",
      "Idempotency-Key": "inquiry-inq-1",
    });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      from: "Machum Studio <onboarding@resend.dev>",
      to: ["admin@example.com"],
      reply_to: "sky@example.com",
      subject: "[Machum Studio] 새 문의: 하늘 김",
    });
    expect(body.html).toContain("&lt;b&gt;가족사진&lt;/b&gt;");
    expect(body.text).toContain("<b>가족사진</b> 문의");
  });

  it.each([
    [400, "validation_error", "[resend] 발송 실패 (400 validation_error)"],
    [403, "validation_error", "[resend] 발송 실패 (403 validation_error)"],
    [
      429,
      "daily_quota_exceeded",
      "[resend] 발송 실패 (429 daily_quota_exceeded) 발송 한도 또는 속도 제한",
    ],
    [
      500,
      "internal_server_error",
      "[resend] 발송 실패 (500 internal_server_error)",
    ],
  ])("%i 응답이면 던진다", async (status, name, message) => {
    const fetch = respond(status, {
      statusCode: status,
      name,
      message:
        "You can only send testing emails to your own email address (admin@example.com).",
    });
    const sending = createResendNotifier(env, { fetch }).notifyNewInquiry(
      inquiry,
    );
    await expect(sending).rejects.toThrow(message);
  });

  it("에러 메시지에 키, 주소, 문의 내용을 넣지 않는다 (Resend 메시지도 쓰지 않는다)", async () => {
    const fetch = respond(403, {
      name: "validation_error",
      message: "own email address (admin@example.com)",
    });
    const error = await createResendNotifier(env, { fetch })
      .notifyNewInquiry(inquiry)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    const text = `${(error as Error).message} ${String((error as Error).cause ?? "")}`;
    for (const secret of [
      "re_test_key",
      "admin@example.com",
      "sky@example.com",
      "가족사진",
    ])
      expect(text).not.toContain(secret);
  });

  it("본문이 JSON 이 아니어도 상태 코드로 던진다", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(
      async () => new Response("Bad Gateway", { status: 502 }),
    );
    await expect(
      createResendNotifier(env, { fetch }).notifyNewInquiry(inquiry),
    ).rejects.toThrow("[resend] 발송 실패 (502)");
  });

  it("네트워크 오류면 던진다", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(
      createResendNotifier(env, { fetch }).notifyNewInquiry(inquiry),
    ).rejects.toThrow("[resend] 요청을 보내지 못했다 (네트워크)");
  });

  it("응답이 늦으면 timeoutMs 에 끊고 던진다", async () => {
    // 실제 fetch 처럼 signal 이 끊기면 거부되고, 그 전에는 끝나지 않는다
    const fetch = vi.fn<typeof globalThis.fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () =>
            reject(init.signal?.reason),
          ),
        ),
    );
    const started = Date.now();
    await expect(
      createResendNotifier(env, { fetch, timeoutMs: 20 }).notifyNewInquiry(
        inquiry,
      ),
    ).rejects.toThrow("[resend] 20ms 안에 응답이 없어 발송을 포기했다");
    expect(Date.now() - started).toBeLessThan(1000);
  });
});
