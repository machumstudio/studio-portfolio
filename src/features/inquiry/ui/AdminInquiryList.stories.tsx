import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { AdminInquiryRow } from "../admin-view";
import { AdminInquiryList } from "./AdminInquiryList";

const items: AdminInquiryRow[] = [
  {
    id: "00000000-0000-4000-8000-00000000c001",
    name: "하늘 김",
    email: "sky@example.com",
    receivedAt: new Date("2026-10-24T09:05:00Z"),
    status: "New",
    preview: "가족사진 촬영 문의드립니다. 4명이고 11월 주말을 생각하고 있어요.",
  },
  {
    id: "00000000-0000-4000-8000-00000000c002",
    name: "Alex Morgan",
    email: "alex.morgan.very.long.address@example-photography-clients.com",
    receivedAt: new Date("2026-10-22T14:30:00Z"),
    status: "Read",
    preview:
      "Hi! We are planning a small wedding in May and would love to know whether you are available for a full-day shoot including…",
  },
  {
    id: "00000000-0000-4000-8000-00000000c003",
    name: "😀 이모지 박",
    email: "park@example.co.kr",
    receivedAt: new Date("2026-10-01T00:00:00Z"),
    status: "Done",
    preview: "제품 촬영 견적 부탁드립니다. - 30컷 - 흰 배경",
  },
];

const meta = {
  title: "Features/Inquiry/AdminInquiryList",
  component: AdminInquiryList,
  args: {
    list: {
      items,
      counts: { New: 1, Read: 1, Done: 1 },
      total: 3,
      status: null,
      page: 1,
      pageCount: 1,
    },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-6xl page-x py-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AdminInquiryList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {};

export const FilteredWithPages: Story = {
  args: {
    list: {
      items: items.slice(0, 1),
      counts: { New: 45, Read: 3, Done: 120 },
      total: 168,
      status: "New",
      page: 2,
      pageCount: 3,
    },
  },
};

export const Deleted: Story = { args: { notice: "deleted" } };

export const Empty: Story = {
  args: {
    list: {
      items: [],
      counts: { New: 0, Read: 0, Done: 0 },
      total: 0,
      status: null,
      page: 1,
      pageCount: 1,
    },
  },
};

export const EmptyFilter: Story = {
  args: {
    list: {
      items: [],
      counts: { New: 0, Read: 2, Done: 5 },
      total: 7,
      status: "New",
      page: 1,
      pageCount: 1,
    },
  },
};

export const Mobile: Story = { globals: { viewport: { value: "mobile" } } };
