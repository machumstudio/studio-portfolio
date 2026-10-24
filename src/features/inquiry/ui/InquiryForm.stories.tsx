import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { InquiryFormState } from "../form-state";
import { InquiryForm } from "./InquiryForm";

// 서버 액션 대신 정해진 결과를 돌려주는 가짜. 실제 검증은 서버(domain)에서만 한다
const respond =
  (state: InquiryFormState, delay = 600) =>
  () =>
    new Promise<InquiryFormState>((resolve) =>
      setTimeout(() => resolve(state), delay),
    );

const values = {
  firstName: "하늘",
  lastName: "",
  email: "sky@",
  phone: "12",
  message: "",
};

const meta = {
  title: "Features/Inquiry/InquiryForm",
  component: InquiryForm,
  args: { action: respond({ status: "success" }) },
  decorators: [
    (Story) => (
      <div className="max-w-5xl page-x py-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InquiryForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 화면. 제출하면 0.6초 뒤 성공 */
export const Idle: Story = {};

/** 빈 칸, 틀린 칸이 한 번에 표시되고 첫 오류 칸(성)에 포커스 */
export const Invalid: Story = {
  args: {
    initialState: {
      status: "invalid",
      values,
      errors: {
        lastName: { code: "required" },
        email: { code: "invalidEmail" },
        phone: { code: "invalidPhone" },
        message: { code: "required" },
      },
    },
  },
};

/** 한도 초과 (한도는 domain 값) */
export const TooLong: Story = {
  args: {
    initialState: {
      status: "invalid",
      values: {
        ...values,
        lastName: "김",
        email: "sky@example.com",
        phone: "",
      },
      errors: { message: { code: "tooLong", max: 2000 } },
    },
  },
};

export const Success: Story = {
  args: { initialState: { status: "success" } },
};

/** 저장 실패 같은 일시 오류. 입력값은 그대로 */
export const ServerError: Story = {
  args: {
    initialState: {
      status: "error",
      values: {
        firstName: "하늘",
        lastName: "김",
        email: "sky@example.com",
        phone: "",
        message: "가족사진 촬영 문의드립니다.",
      },
    },
  },
};

/** 제출 중: 버튼 비활성 + "보내는 중". 응답이 오지 않는 가짜라 제출 후 그대로 멈춘다 */
export const Pending: Story = {
  args: { action: () => new Promise<InquiryFormState>(() => {}) },
};

export const Mobile: Story = {
  ...Invalid,
  globals: { viewport: { value: "mobile", isRotated: false } },
};

export const Laptop: Story = {
  globals: { viewport: { value: "laptop", isRotated: false } },
};

export const Desktop: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
};
