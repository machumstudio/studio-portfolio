import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PriceCard } from "./PriceCard";

const meta = {
  title: "UI/PriceCard",
  component: PriceCard,
  args: {
    name: "개인 촬영",
    price: { amount: 250_000, currency: "KRW" },
    customPriceLabel: "맞춤 견적",
    features: [
      "한 사람의 개성과 분위기를 담기에 알맞습니다.",
      "2시간 촬영과 보정본 20장을 포함합니다.",
      "보정본은 장당 1만 원에 추가할 수 있습니다.",
    ],
    actionLabel: "상담 예약",
  },
  decorators: [
    (Story) => (
      <div className="page-x">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PriceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
export const Laptop: Story = {
  globals: { viewport: { value: "laptop", isRotated: false } },
};
export const Desktop: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
};

// 자릿수가 많은 가격 (₩150만)
export const LargePrice: Story = {
  args: { name: "웨딩 촬영", price: { amount: 1_500_000, currency: "KRW" } },
  globals: { viewport: { value: "laptop", isRotated: false } },
};

// 가격 대신 맞춤 견적
export const CustomPrice: Story = {
  args: {
    name: "기업 행사",
    price: undefined,
    features: [
      "기업 모임, 컨퍼런스, 세미나에 맞춰 촬영을 구성합니다.",
      "행사 내용을 알려 주시면 맞춤 견적을 보내 드립니다.",
    ],
  },
  globals: { viewport: { value: "laptop", isRotated: false } },
};
