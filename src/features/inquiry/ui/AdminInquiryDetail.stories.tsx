import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AdminInquiryDetail } from "./AdminInquiryDetail";

// 스토리에서는 서버 액션 대신 잠깐 기다리기만 한다 (보내는 중 글자 확인용)
const wait = () => new Promise<void>((done) => setTimeout(done, 1500));

const meta = {
  title: "Features/Inquiry/AdminInquiryDetail",
  component: AdminInquiryDetail,
  args: {
    inquiry: {
      id: "00000000-0000-4000-8000-00000000c001",
      name: "하늘 김",
      email: "sky@example.com",
      phone: "+82 10-1234-5678",
      message:
        "안녕하세요. 가족사진 촬영 문의드립니다.\n\n- 인원: 4명 (아이 2명)\n- 날짜: 11월 주말\n- 장소: 스튜디오\n\n견적과 가능한 날짜 알려 주세요.",
      receivedAt: new Date("2026-10-24T09:05:00Z"),
      status: "New",
      changedAt: null,
      actions: ["markRead"],
    },
    actions: { changeStatus: wait, remove: wait },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-6xl page-x py-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AdminInquiryDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const New: Story = {};

export const ReadJustChanged: Story = {
  args: {
    inquiry: {
      ...meta.args.inquiry,
      status: "Read",
      changedAt: new Date("2026-10-24T10:00:00Z"),
      actions: ["markDone"],
    },
    notice: "markRead",
  },
};

export const DoneNoPhone: Story = {
  args: {
    inquiry: {
      ...meta.args.inquiry,
      phone: null,
      status: "Done",
      changedAt: new Date("2026-10-25T02:00:00Z"),
      actions: ["reopen"],
    },
  },
};

export const ConflictFromOtherTab: Story = {
  args: {
    inquiry: {
      ...meta.args.inquiry,
      status: "Read",
      changedAt: new Date("2026-10-24T10:00:00Z"),
      actions: ["markDone"],
    },
    notice: "conflict",
  },
};

export const LongMessage: Story = {
  args: {
    inquiry: {
      ...meta.args.inquiry,
      email: "alex.morgan.very.long.address@example-photography-clients.com",
      message: `${"아주 긴 한 줄 메시지입니다. ".repeat(60)}\n\nhttps://example.com/${"x".repeat(120)}`,
    },
  },
};

export const Mobile: Story = { globals: { viewport: { value: "mobile" } } };
