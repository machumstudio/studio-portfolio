import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/ko.json";
import type { SaveWorkState } from "../form-state";
import type { WorkFormValues } from "../schema";
import { createPhotoUploader, type PhotoUploader } from "./photo-file";
import { WorkEditor, type WorkEditorActions } from "./WorkEditor";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

beforeEach(() => {
  router.replace.mockClear();
  router.refresh.mockClear();
});

// jsdom 에는 <dialog> 의 showModal 이 없다
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});

const blank: WorkFormValues = {
  id: "new-1",
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

const existing: WorkFormValues = {
  id: "work-01",
  isNew: false,
  titleKo: "단단한 얼굴들",
  titleEn: "Faces of Resilience",
  slug: "faces-of-resilience",
  category: "portrait",
  date: "2022-03",
  published: true,
  photos: ["a", "b", "c"].map((name) => ({
    src: `/images/works/${name}.jpg`,
    altKo: "",
    altEn: "",
  })),
  coverSrc: "/images/works/a.jpg",
};

// 파일 이름을 그대로 src 로 돌려주는 가짜 업로드
const fakeUpload: PhotoUploader = async (file) => ({
  src: `/media/work-photos/new-1/${file.name}`,
});

const setup = (
  initial: WorkFormValues,
  {
    save = async () => ({
      status: "saved",
      id: initial.id,
      slug: "x",
      published: false,
    }),
    upload = fakeUpload,
    remove = async () => {},
  }: {
    save?: (values: WorkFormValues) => Promise<SaveWorkState>;
    upload?: PhotoUploader;
    remove?: WorkEditorActions["remove"];
  } = {},
) => {
  const actions = {
    save: vi.fn(save),
    remove: vi.fn(remove),
    prepareUpload: vi.fn(),
  };
  const user = userEvent.setup();
  const view = render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <WorkEditor initial={initial} actions={actions} upload={upload} />
    </NextIntlClientProvider>,
  );
  const fileInput =
    view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
  return { actions, user, fileInput };
};

const photo = (name: string, type = "image/jpeg") =>
  new File([new Uint8Array(4)], name, { type });

const order = () =>
  within(screen.getByRole("list", { name: "사진 순서" }))
    .getAllByRole("listitem")
    .map((item) => item.getAttribute("data-photo-src")!.split("/").pop());

const saveStatus = () =>
  screen
    .getAllByRole("status")
    .find((el) => el.closest("form") && !el.classList.contains("sr-only"))!;

describe("WorkEditor 새 작업", () => {
  it("칸을 채우고 사진 여러 장을 올려 저장하면 화면 값 그대로 보낸다. 첫 사진이 대표", async () => {
    const { actions, user, fileInput } = setup(blank, {
      save: async () => ({
        status: "saved",
        id: "new-1",
        slug: "jeju-wedding",
        published: true,
      }),
    });
    await user.type(screen.getByLabelText("제목 (한국어)"), "제주 결혼식");
    await user.type(screen.getByLabelText("제목 (영어)"), "Jeju Wedding");
    // 주소 이름은 영어 제목을 따라 채워진다
    expect(screen.getByLabelText("주소 이름")).toHaveValue("jeju-wedding");
    await user.selectOptions(screen.getByLabelText("분야"), "events");
    await user.type(screen.getByLabelText("촬영 연월"), "2024-05");
    await user.click(screen.getByLabelText("공개하기"));
    await user.upload(fileInput, [photo("a.jpg"), photo("b.png", "image/png")]);
    await waitFor(() => expect(order()).toEqual(["a.jpg", "b.png"]));
    expect(
      screen.getByRole("button", { name: "사진 1 대표로 지정" }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(actions.save).toHaveBeenCalledWith({
      ...blank,
      titleKo: "제주 결혼식",
      titleEn: "Jeju Wedding",
      slug: "jeju-wedding",
      category: "events",
      date: "2024-05",
      published: true,
      photos: [
        { src: "/media/work-photos/new-1/a.jpg", altKo: "", altEn: "" },
        { src: "/media/work-photos/new-1/b.png", altKo: "", altEn: "" },
      ],
      coverSrc: "/media/work-photos/new-1/a.jpg",
    });
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        "/admin/works/new-1?created=1",
      ),
    );
  });

  it("틀린 칸을 모두 표시하고 첫 오류 칸으로 포커스, 개수는 status 로", async () => {
    const { user } = setup(blank, {
      save: async () => ({
        status: "invalid",
        errors: {
          titleKo: { code: "required" },
          slug: { code: "taken" },
          photos: { code: "required" },
        },
      }),
    });
    await user.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(screen.getByLabelText("제목 (한국어)")).toHaveFocus(),
    );
    expect(screen.getByLabelText("제목 (한국어)")).toHaveAccessibleDescription(
      "한국어 제목을 입력해 주세요.",
    );
    expect(screen.getByLabelText("주소 이름")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      screen.getByText("다른 작업이 이미 쓰는 주소 이름입니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("사진을 한 장 이상 올려 주세요."),
    ).toBeInTheDocument();
    expect(saveStatus()).toHaveTextContent("고칠 칸이 3개 있습니다.");
  });

  it("세션이 끝나면 입력을 그대로 두고 다시 로그인하라고 알린다", async () => {
    const { user } = setup(blank, {
      save: async () => ({ status: "error", code: "signedOut" }),
    });
    await user.type(screen.getByLabelText("제목 (한국어)"), "남는 제목");
    await user.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(saveStatus()).toHaveTextContent(/로그인이 끝났습니다/),
    );
    expect(screen.getByLabelText("제목 (한국어)")).toHaveValue("남는 제목");
  });

  it("사진을 올리는 중에는 저장하지 않고 기다리라고 알린다", async () => {
    let finish: () => void = () => {};
    const { actions, user, fileInput } = setup(blank, {
      upload: (file, _id, onProgress) =>
        new Promise((resolve) => {
          onProgress({ phase: "uploading", ratio: 0.4 });
          finish = () => resolve({ src: `/m/${file.name}` });
        }),
    });
    await user.upload(fileInput, photo("slow.jpg"));
    const progress = await screen.findByRole("progressbar");
    expect(progress).toHaveAttribute("aria-valuenow", "40");
    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(actions.save).not.toHaveBeenCalled();
    expect(saveStatus()).toHaveTextContent(
      "사진을 올리는 중입니다. 다 올라간 뒤 저장해 주세요.",
    );
    await act(async () => finish());
    await waitFor(() => expect(screen.queryByRole("progressbar")).toBeNull());
  });

  it("형식과 크기가 맞지 않는 파일은 친절한 문구로 알리고 닫을 수 있다", async () => {
    const shrink = vi.fn();
    const upload = createPhotoUploader(vi.fn(), { shrink });
    const { user, fileInput } = setup(blank, { upload });
    // accept 를 무시하고 고른 경우 (드래그 앤 드롭은 accept 를 거치지 않는다)
    await userEvent
      .setup({ applyAccept: false })
      .upload(fileInput, [
        photo("IMG_0001.HEIC", "image/heic"),
        new File([new Uint8Array(1)], "huge.jpg", { type: "image/jpeg" }),
      ]);
    const uploads = await screen.findByRole("list", {
      name: "올리는 중인 사진",
    });
    await waitFor(() =>
      expect(
        within(uploads).getByText(/IMG_0001\.HEIC: JPG, PNG, WebP 사진만/),
      ).toBeInTheDocument(),
    );
    expect(shrink).toHaveBeenCalledTimes(1);
    await user.click(
      screen.getByRole("button", { name: "IMG_0001.HEIC 알림 닫기" }),
    );
    expect(screen.queryByText(/IMG_0001\.HEIC:/)).toBeNull();
  });
});

describe("WorkEditor 사진 순서와 대표 (키보드)", () => {
  it("앞으로/뒤로 버튼으로 순서를 바꾸고 결과를 알린다. 포커스는 옮긴 사진의 버튼에 남는다", async () => {
    const { user } = setup(existing);
    const later = screen.getByRole("button", { name: "사진 1 뒤로" });
    later.focus();
    await user.keyboard("{Enter}");
    expect(order()).toEqual(["b.jpg", "a.jpg", "c.jpg"]);
    expect(screen.getByText("사진을 2번째로 옮겼습니다.")).toBeInTheDocument();
    // 옮긴 사진(a)의 버튼은 이제 "사진 2 뒤로"
    expect(screen.getByRole("button", { name: "사진 2 뒤로" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(order()).toEqual(["b.jpg", "c.jpg", "a.jpg"]);
    // 끝에서는 막히지만 포커스는 그대로
    const last = screen.getByRole("button", { name: "사진 3 뒤로" });
    expect(last).toHaveAttribute("aria-disabled", "true");
    expect(last).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(order()).toEqual(["b.jpg", "c.jpg", "a.jpg"]);
  });

  it("대표로 지정은 aria-pressed 로 하나만 눌린다", async () => {
    const { user, actions } = setup(existing);
    await user.click(
      screen.getByRole("button", { name: "사진 3 대표로 지정" }),
    );
    expect(
      screen
        .getAllByRole("button", { name: /대표로 지정/ })
        .map((b) => b.getAttribute("aria-pressed")),
    ).toEqual(["false", "false", "true"]);
    expect(
      screen.getByText("3번째 사진을 대표 사진으로 지정했습니다."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(actions.save.mock.calls[0]![0].coverSrc).toBe("/images/works/c.jpg");
  });

  it("대표 사진을 빼면 남은 첫 사진이 대표가 되고, 포커스는 다음 사진의 빼기 버튼으로", async () => {
    const { user } = setup(existing);
    await user.click(screen.getByRole("button", { name: "사진 1 빼기" }));
    expect(order()).toEqual(["b.jpg", "c.jpg"]);
    expect(
      screen.getByRole("button", { name: "사진 1 대표로 지정" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "사진 1 빼기" })).toHaveFocus();
    expect(screen.getByText(/저장하면 파일도 지워집니다/)).toBeInTheDocument();
  });
});

describe("WorkEditor 있는 작업", () => {
  it("공개 작업은 공개 화면 링크(새 탭)가 있다", () => {
    setup(existing);
    expect(
      screen.getByRole("link", { name: "공개 화면에서 보기 (새 탭)" }),
    ).toHaveAttribute("href", "/work/faces-of-resilience");
  });

  it("저장하면 화면 데이터를 새로 받는다", async () => {
    const { user } = setup(existing);
    await user.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(saveStatus()).toHaveTextContent("저장했습니다."),
    );
    expect(router.refresh).toHaveBeenCalledTimes(1);
  });

  it("지우기는 확인 단계를 거친다. 취소하면 지우지 않고, 실패는 대화상자 안에 알린다", async () => {
    const { user, actions } = setup(existing, {
      remove: async () => ({ status: "error", code: "unavailable" }),
    });
    await user.click(screen.getByRole("button", { name: "작업 지우기" }));
    const dialog = screen.getByRole("dialog", { name: "이 작업을 지울까요?" });
    expect(dialog).toHaveAccessibleDescription(
      "‘단단한 얼굴들’ 작업과 사진 3장을 지웁니다. 지운 뒤에는 되돌릴 수 없습니다.",
    );
    await user.click(within(dialog).getByRole("button", { name: "취소" }));
    expect(actions.remove).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "작업 지우기" }));
    await user.click(within(dialog).getByRole("button", { name: "지우기" }));
    expect(actions.remove).toHaveBeenCalledWith("work-01");
    await waitFor(() =>
      expect(within(dialog).getByRole("status")).toHaveTextContent(
        "지금은 저장할 수 없습니다",
      ),
    );
  });
});
