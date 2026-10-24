import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { oddPhotos } from "@/components/ui/photo-fixtures";
import { AdminWorkList, type AdminWorkRow } from "./AdminWorkList";

const works: AdminWorkRow[] = [
  {
    id: "work-10",
    slug: "behind-the-scenes",
    titleKo: "촬영 현장 기록",
    titleEn: "Behind the Scenes",
    date: "2024-05",
    published: false,
    cover: {
      src: "/images/works/behind-the-scenes-1.jpg",
      alt: "넓은 스튜디오의 촬영 현장",
    },
    photoCount: 3,
  },
  {
    id: "work-01",
    slug: "faces-of-resilience",
    titleKo: "단단한 얼굴들",
    titleEn: "Faces of Resilience",
    date: "2022-03",
    published: true,
    cover: {
      src: "/images/works/faces-of-resilience-1.jpg",
      alt: "갈색 천을 머리에 두른 여성",
    },
    photoCount: 3,
  },
  ...oddPhotos(3).map((photo, i) => ({
    id: `odd-${i}`,
    slug: `odd-${i}`,
    titleKo: `비율이 다른 대표 사진 ${i + 1}`,
    titleEn: `Odd cover ${i + 1}`,
    date: "2021-09",
    published: i % 2 === 0,
    cover: photo,
    photoCount: 30,
  })),
];

const meta = {
  title: "Features/Works/AdminWorkList",
  component: AdminWorkList,
  args: { works },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-5xl page-x py-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AdminWorkList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};

export const Empty: Story = { args: { works: [] } };

/** 작업을 지우고 목록으로 돌아왔을 때 */
export const Deleted: Story = { args: { notice: "deleted" } };

export const Mobile: Story = { globals: { viewport: { value: "mobile" } } };
