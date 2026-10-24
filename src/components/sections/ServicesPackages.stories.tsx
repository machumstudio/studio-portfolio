import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import messages from "../../../messages/ko.json";
import { ServicesPackages, type ServiceOffering } from "./ServicesPackages";
import { oddPhotos } from "@/components/ui/photo-fixtures";

const page = messages.ServicesPage;
const photo = { src: "/images/services/events-1.jpg", alt: "" };
type PackageId = keyof typeof page.packages;
type ServiceId = keyof typeof page.services;

// 페이지와 같은 구성 (가격은 원화)
const packages: Record<ServiceId, [PackageId, number?][]> = {
  portrait: [
    ["individual", 250_000],
    ["family", 400_000],
    ["couple", 300_000],
  ],
  events: [["wedding", 1_500_000], ["party", 800_000], ["corporate"]],
  commercial: [["product", 500_000], ["space", 700_000], ["brand"]],
};

const services: ServiceOffering[] = (Object.keys(packages) as ServiceId[]).map(
  (id) => ({
    id,
    title: page.services[id],
    body: messages.Services.items[id].body,
    images: [photo, photo, photo],
    packages: packages[id].map(([pkg, amount]) => ({
      id: pkg,
      name: page.packages[pkg].name,
      price: amount ? { amount, currency: "KRW" } : undefined,
      features: Object.values(page.packages[pkg].features),
    })),
  }),
);

const meta = {
  title: "Sections/ServicesPackages",
  component: ServicesPackages,
  args: { services },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ServicesPackages>;

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

// 관리자 업로드처럼 비율/크기가 제각각인 사진(1:4, 4:1, 200px). 사진 칸 크기와 주변 배치는 그대로, 사진만 잘린다
export const OddPhotos: Story = {
  args: {
    services: services.map((service) => ({ ...service, images: oddPhotos(3) })),
  },
  globals: { viewport: { value: "laptop", isRotated: false } },
};
