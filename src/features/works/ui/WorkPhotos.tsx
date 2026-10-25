"use client";

import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type DragEvent,
  type ReactNode,
} from "react";
import { photoLimits, photoTypes } from "@/application/works/photo-limits";
import { buttonStyles } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { Field, Input } from "@/components/ui/Field";
import type { EditorAction, EditorPhoto } from "./editor-state";
import {
  PhotoUploadError,
  type PhotoProblem,
  type PhotoUploader,
  type UploadProgress,
} from "./photo-file";

type Upload = {
  id: number;
  name: string;
  progress: UploadProgress | null;
  problem?: PhotoProblem;
};

type WorkPhotosProps = {
  workId: string;
  photos: readonly EditorPhoto[];
  coverSrc: string;
  dispatch: Dispatch<EditorAction>;
  upload: PhotoUploader;
  /** 저장 결과의 칸 오류 문구 */
  error?: string;
  /** 올리는 중인 사진이 있는지 (편집 화면이 저장을 막는다) */
  onBusyChange: (busy: boolean) => void;
};

/** 순서 바꾸기 드래그의 데이터 형식. 파일 드래그(Files)와 구분한다 */
const reorderType = "application/x-machum-photo-index";

const originalMb = photoLimits.originalBytes / 1024 / 1024;

// 작업 사진 관리: 올리기(드래그 앤 드롭, 파일 고르기, 여러 장), 순서 바꾸기, 대표 지정, 빼기, 설명.
// - 올리기: 한 장씩 차례로 줄이고 올린다 (큰 사진 여러 장을 한꺼번에 디코딩하면 휴대폰 메모리가 모자란다).
//   진행은 role=progressbar 로, 실패는 파일 이름과 이유를 목록에 남긴다 (닫을 때까지)
// - 순서: 끌어서 놓기 + 앞으로/뒤로 버튼(키보드, 터치). 버튼은 끝에서 aria-disabled 로 막아 포커스를 잃지 않는다
// - 대표: aria-pressed 버튼. 대표를 빼면 남은 첫 사진이 대표가 된다 (editorReducer)
// - 바뀐 결과는 role=status 로 알린다 (스크린리더)
// 시안에 없는 화면이라 기존 버튼/Field/토큰만 쓴다
export function WorkPhotos({
  workId,
  photos,
  coverSrc,
  dispatch,
  upload,
  error,
  onBusyChange,
}: WorkPhotosProps) {
  const t = useTranslations("AdminWorks.photos");
  const headingId = useId();
  const hintId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [dragging, setDragging] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [fileOver, setFileOver] = useState(false);
  const queue = useRef(Promise.resolve());
  const nextUploadId = useRef(0);
  // 비동기 업로드가 끝날 때 최신 장수를 보려고 ref 에 둔다
  const photoCount = useRef(photos.length);
  useEffect(() => {
    photoCount.current = photos.length;
  }, [photos.length]);
  const focusAfterRemove = useRef<string | null>(null);

  const busy = uploads.some((item) => !item.problem);
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  // 사진을 빼면 같은 자리(없으면 앞) 사진의 빼기 버튼으로, 다 빠지면 사진 고르기 버튼으로 포커스를 옮긴다
  useEffect(() => {
    const target = focusAfterRemove.current;
    if (target === null) return;
    focusAfterRemove.current = null;
    const button = target
      ? listRef.current?.querySelector<HTMLElement>(
          `[data-photo-src="${CSS.escape(target)}"] [data-action="remove"]`,
        )
      : null;
    (button ?? document.getElementById(`${headingId}-pick`))?.focus();
  }, [photos, headingId]);

  const patch = (id: number, change: Partial<Upload>) =>
    setUploads((list) =>
      list.map((item) => (item.id === id ? { ...item, ...change } : item)),
    );

  const problemText = (code: PhotoProblem) =>
    t(`problems.${code}`, { max: originalMb, count: photoLimits.perWork });

  const run = async (id: number, file: File) => {
    try {
      const { src } = await upload(file, workId, (progress) =>
        patch(id, { progress }),
      );
      dispatch({ type: "addPhoto", src });
      setUploads((list) => list.filter((item) => item.id !== id));
      setAnnouncement(t("announce.added", { count: photoCount.current + 1 }));
    } catch (cause) {
      const problem =
        cause instanceof PhotoUploadError ? cause.code : "uploadFailed";
      patch(id, { problem });
      setAnnouncement(t("announce.failed", { name: file.name }));
    }
  };

  const enqueue = (files: readonly File[]) => {
    const waiting = uploads.filter((item) => !item.problem).length;
    let room = photoLimits.perWork - photoCount.current - waiting;
    const added: Upload[] = [];
    for (const file of files) {
      const id = nextUploadId.current++;
      if (room <= 0) {
        added.push({ id, name: file.name, progress: null, problem: "tooMany" });
        continue;
      }
      room--;
      added.push({ id, name: file.name, progress: null });
      queue.current = queue.current.then(() => run(id, file));
    }
    setUploads((list) => [...list, ...added]);
  };

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    enqueue([...(event.target.files ?? [])]);
    // 같은 파일을 다시 고를 수 있게 비운다
    event.target.value = "";
  };

  const hasFiles = (event: DragEvent) =>
    event.dataTransfer.types.includes("Files");

  const onFileDragOver = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setFileOver(true);
  };

  const onFileDrop = (event: DragEvent) => {
    setFileOver(false);
    if (!hasFiles(event)) return;
    event.preventDefault();
    enqueue([...event.dataTransfer.files]);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= photos.length || from === to) return;
    dispatch({ type: "movePhoto", from, to });
    setAnnouncement(t("announce.moved", { index: to + 1 }));
  };

  const remove = (index: number) => {
    const next = photos[index + 1] ?? photos[index - 1];
    focusAfterRemove.current = next?.src ?? "";
    dispatch({ type: "removePhoto", index });
    setAnnouncement(t("announce.removed"));
  };

  const endDrag = () => {
    setDragging(null);
    setDropTarget(null);
  };

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-5"
      onDragOver={onFileDragOver}
      onDragLeave={() => setFileOver(false)}
      onDrop={onFileDrop}
    >
      <div className="flex flex-col gap-2.5">
        <h2 id={headingId} className="text-h4 text-white">
          {t("title")}
        </h2>
        <p className="text-body text-grey-50">{t("description")}</p>
      </div>

      <div
        className={cx(
          "flex flex-col items-center gap-4 rounded-10 border border-dashed px-5 py-10 text-center transition-colors",
          // 끌어 놓는 중에는 테두리 색과 실선으로 알린다. 배경은 그대로 둬 안내 글(grey-50)의 대비를 지킨다
          fileOver
            ? "border-solid border-purple-70 bg-dark-06"
            : "border-dark-30 bg-dark-06",
        )}
      >
        <ImagePlus aria-hidden className="size-8 text-grey-50" />
        <p className="text-body text-grey-70">{t("drop")}</p>
        <button
          type="button"
          id={`${headingId}-pick`}
          name="photos"
          onClick={() => inputRef.current?.click()}
          aria-describedby={cx(hintId, error && errorId) || undefined}
          className={buttonStyles({ variant: "outline" })}
        >
          {t("pick")}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={photoTypes.join(",")}
          onChange={onPick}
          tabIndex={-1}
          aria-hidden
          className="sr-only"
        />
        <p id={hintId} className="text-body text-grey-50">
          {t("rules", { max: originalMb, count: photoLimits.perWork })}
        </p>
      </div>

      {error && (
        <p id={errorId} className="text-body text-purple-80">
          {error}
        </p>
      )}

      {uploads.length > 0 && (
        <ul aria-label={t("uploadsLabel")} className="flex flex-col gap-2.5">
          {uploads.map((item) => (
            <UploadRow
              key={item.id}
              item={item}
              problemText={problemText}
              onDismiss={() =>
                setUploads((list) => list.filter(({ id }) => id !== item.id))
              }
            />
          ))}
        </ul>
      )}

      {photos.length > 0 && (
        <>
          <p className="text-body text-grey-50">{t("reorderHint")}</p>
          <ol
            ref={listRef}
            aria-label={t("listLabel")}
            className="flex flex-col gap-4"
          >
            {photos.map((photo, index) => {
              const isCover = photo.src === coverSrc;
              const n = index + 1;
              return (
                <li
                  key={photo.src}
                  data-photo-src={photo.src}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(reorderType, String(index));
                    event.dataTransfer.effectAllowed = "move";
                    setDragging(index);
                  }}
                  onDragOver={(event) => {
                    if (dragging === null) return;
                    event.preventDefault();
                    event.stopPropagation();
                    setDropTarget(index);
                  }}
                  onDrop={(event) => {
                    if (dragging === null) return;
                    event.preventDefault();
                    event.stopPropagation();
                    move(dragging, index);
                    endDrag();
                  }}
                  onDragEnd={endDrag}
                  className={cx(
                    "grid cursor-grab grid-cols-1 gap-4 rounded-10 border bg-dark-06 p-4 md:grid-cols-3 lg:p-5",
                    dropTarget === index && dragging !== index
                      ? "border-purple-70"
                      : "border-dark-12",
                    dragging === index && "opacity-50",
                  )}
                >
                  <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-dark-15">
                    <Image
                      src={photo.src}
                      alt={photo.altKo || t("photoAlt", { index: n })}
                      fill
                      sizes="(min-width: 768px) 240px, 100vw"
                      className="object-cover"
                      draggable={false}
                    />
                    {isCover && (
                      <span className="absolute top-2 left-2 rounded-full bg-purple-55 px-2.5 py-1 text-caption text-white">
                        {t("cover")}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 md:col-span-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="mr-auto text-label text-grey-90">
                        {t("position", { index: n })}
                      </span>
                      <button
                        type="button"
                        aria-pressed={isCover}
                        aria-label={t("makeCoverLabel", { index: n })}
                        onClick={() => {
                          if (isCover) return;
                          dispatch({ type: "setCover", src: photo.src });
                          setAnnouncement(t("announce.cover", { index: n }));
                        }}
                        className={cx(
                          buttonStyles({ variant: "outline" }),
                          "aria-pressed:border-purple-70 aria-pressed:text-purple-80",
                        )}
                      >
                        <Star
                          aria-hidden
                          className={cx(isCover && "fill-current")}
                        />
                        {/* 토글 버튼: 이름은 그대로 두고 눌림(aria-pressed)으로 상태를 알린다. 보이는 글자도 이름과 같게 */}
                        {t("makeCover")}
                      </button>
                      <IconAction
                        label={t("moveUpLabel", { index: n })}
                        disabled={index === 0}
                        onClick={() => move(index, index - 1)}
                      >
                        <ArrowUp aria-hidden />
                      </IconAction>
                      <IconAction
                        label={t("moveDownLabel", { index: n })}
                        disabled={index === photos.length - 1}
                        onClick={() => move(index, index + 1)}
                      >
                        <ArrowDown aria-hidden />
                      </IconAction>
                      <IconAction
                        label={t("removeLabel", { index: n })}
                        action="remove"
                        onClick={() => remove(index)}
                      >
                        <Trash2 aria-hidden />
                      </IconAction>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {(["ko", "en"] as const).map((locale) => (
                        <Field
                          key={locale}
                          label={
                            <>
                              <span className="sr-only">
                                {t("altLabel", { index: n })}{" "}
                              </span>
                              {t(locale === "ko" ? "altKo" : "altEn")}
                            </>
                          }
                        >
                          {(props) => (
                            <Input
                              {...props}
                              value={
                                locale === "ko" ? photo.altKo : photo.altEn
                              }
                              onChange={(event) =>
                                dispatch({
                                  type: "setAlt",
                                  index,
                                  locale,
                                  value: event.target.value,
                                })
                              }
                              placeholder={t("altHint")}
                              className="placeholder:normal-case"
                            />
                          )}
                        </Field>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}

function IconAction({
  label,
  disabled,
  action,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  action?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-disabled={disabled || undefined}
      data-action={action}
      onClick={() => {
        if (!disabled) onClick();
      }}
      className={buttonStyles({
        variant: "icon",
        className: "aria-disabled:cursor-not-allowed aria-disabled:opacity-40",
      })}
    >
      {children}
    </button>
  );
}

function UploadRow({
  item,
  problemText,
  onDismiss,
}: {
  item: Upload;
  problemText: (code: PhotoProblem) => string;
  onDismiss: () => void;
}) {
  const t = useTranslations("AdminWorks.photos");
  const percent =
    item.progress?.phase === "uploading"
      ? Math.round(item.progress.ratio * 100)
      : 0;
  if (item.problem)
    return (
      <li className="flex items-center gap-4 rounded-lg border border-dark-12 bg-dark-06 px-4 py-3">
        <p className="mr-auto text-body text-purple-80">
          {t("failed", { name: item.name, reason: problemText(item.problem) })}
        </p>
        <button
          type="button"
          aria-label={t("dismiss", { name: item.name })}
          onClick={onDismiss}
          className={buttonStyles({ variant: "icon" })}
        >
          <X aria-hidden />
        </button>
      </li>
    );
  const label =
    item.progress?.phase === "uploading"
      ? t("uploading", { name: item.name, percent })
      : t("processing", { name: item.name });
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-dark-12 bg-dark-06 px-4 py-3">
      <p className="text-body text-grey-70">{label}</p>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-1.5 overflow-hidden rounded-full bg-dark-20"
      >
        <div
          className="h-full origin-left bg-purple-55 transition-transform"
          style={{ transform: `scaleX(${percent / 100})` }}
        />
      </div>
    </li>
  );
}
