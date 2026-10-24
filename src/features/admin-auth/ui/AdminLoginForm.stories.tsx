import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { AdminLoginState } from "../form-state";
import { AdminLoginForm } from "./AdminLoginForm";

// 서버 액션 대신 정해진 결과를 돌려주는 가짜. 실제 확인은 서버(인증 서비스 + domain)에서만 한다
const respond =
  (state: AdminLoginState, delay = 600) =>
  () =>
    new Promise<AdminLoginState>((resolve) =>
      setTimeout(() => resolve(state), delay),
    );

const meta = {
  title: "Features/AdminAuth/AdminLoginForm",
  component: AdminLoginForm,
  args: {
    action: respond({
      status: "error",
      code: "invalid",
      email: "admin@example.com",
    }),
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-md page-x py-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AdminLoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 화면. 제출하면 0.6초 동안 "로그인하는 중" 뒤 실패 */
export const Idle: Story = {};

/** 없는 이메일, 틀린 비밀번호, 관리자 아님이 모두 이 문구 하나 */
export const Invalid: Story = {
  args: {
    initialState: {
      status: "error",
      code: "invalid",
      email: "admin@example.com",
    },
  },
};

export const Required: Story = {
  args: { initialState: { status: "error", code: "required", email: "" } },
};

/** 인증 서비스 장애, 요청 한도 */
export const Unavailable: Story = {
  args: {
    initialState: {
      status: "error",
      code: "unavailable",
      email: "admin@example.com",
    },
  },
};

/** 제출 중 (응답이 오지 않는 액션) */
export const Pending: Story = {
  args: { action: () => new Promise<AdminLoginState>(() => {}) },
};
