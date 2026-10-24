import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  oddPhotos,
  tallPhoto,
  widePhoto,
} from "@/components/ui/photo-fixtures";
import type { SaveWorkState } from "../form-state";
import type { WorkFormValues } from "../schema";
import type { PhotoUploader } from "./photo-file";
import { WorkEditor } from "./WorkEditor";

// 서버 액션 대신 정해진 결과를 돌려주는 가짜. 실제 검사는 서버(domain/application)에서만 한다
const respond =
  (state: SaveWorkState, delay = 600) =>
  () =>
    new Promise<SaveWorkState>((resolve) =>
      setTimeout(() => resolve(state), delay),
    );

// 줄이기와 올리기를 흉내 낸다: 0.4초 줄이고 1.5초에 걸쳐 올린 뒤 비율이 제각각인 사진을 돌려준다
let uploaded = 0;
const fakeUpload: PhotoUploader = async (_file, _workId, onProgress) => {
  onProgress({ phase: "processing" });
  await new Promise((r) => setTimeout(r, 400));
  for (let step = 0; step <= 10; step++) {
    onProgress({ phase: "uploading", ratio: step / 10 });
    await new Promise((r) => setTimeout(r, 150));
  }
  const photo = [tallPhoto, widePhoto][uploaded++ % 2]!;
  return { src: `${photo.src}#${uploaded}` };
};

const blank: WorkFormValues = {
  id: "0b5c4a8e-1f2d-4c3b-9a7e-2d1f0c9b8a7e",
  isNew: true,
  titleKo: "",
  titleEn: "",
  slug: "",
  category: "",
  date: "",
  published: false,
  photos: [],
  coverSrc: "",
};

const photos = oddPhotos(3).map((photo, i) => ({
  src: `${photo.src}#${i}`,
  altKo: photo.alt,
  altEn: "",
}));

const existing: WorkFormValues = {
  id: "work-01",
  isNew: false,
  titleKo: "단단한 얼굴들",
  titleEn: "Faces of Resilience",
  slug: "faces-of-resilience",
  category: "portrait",
  date: "2022-03",
  published: true,
  photos,
  coverSrc: photos[1]!.src,
};

const meta = {
  title: "Features/Works/WorkEditor",
  component: WorkEditor,
  args: {
    initial: blank,
    actions: {
      save: respond({
        status: "saved",
        id: blank.id,
        slug: "jeju-wedding",
        published: false,
      }),
      remove: async () => ({ status: "error", code: "unavailable" }),
      prepareUpload: async () => ({ ok: false, code: "unavailable" }),
    },
    upload: fakeUpload,
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-5xl page-x py-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WorkEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 새 작업. 영어 제목을 쓰면 주소 이름이 따라 채워진다. 사진을 고르면 진행 막대가 보인다 */
export const NewWork: Story = {};

/** 비율이 제각각인 사진 3장 (세로 1:4, 가로 4:1, 작은 사진). 두 번째가 대표 */
export const Existing: Story = { args: { initial: existing } };

/** 저장하면 칸 오류 3개 (제목, 주소 이름 중복, 사진 없음) */
export const Invalid: Story = {
  args: {
    actions: {
      ...meta.args.actions,
      save: respond({
        status: "invalid",
        errors: {
          titleKo: { code: "required" },
          slug: { code: "taken" },
          photos: { code: "required" },
        },
      }),
    },
  },
};

/** 편집 중 세션이 끝났을 때. 입력은 그대로 남는다 */
export const SignedOut: Story = {
  args: {
    initial: existing,
    actions: {
      ...meta.args.actions,
      save: respond({ status: "error", code: "signedOut" }),
    },
  },
};

export const Mobile: Story = {
  args: { initial: existing },
  globals: { viewport: { value: "mobile" } },
};
