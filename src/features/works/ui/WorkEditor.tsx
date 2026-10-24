"use client";

import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { workCategories } from "@/application/works/work-options";
import { buttonStyles } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { Field, Input, Select } from "@/components/ui/Field";
import {
  firstWorkErrorField,
  type DeleteWorkState,
  type PrepareUploadResult,
  type SaveWorkState,
  type WorkFieldName,
} from "../form-state";
import type { WorkFormValues } from "../schema";
import { DeleteWorkDialog } from "./DeleteWorkDialog";
import { editorReducer, toFormValues, type EditorState } from "./editor-state";
import { createPhotoUploader, type PhotoUploader } from "./photo-file";
import { WorkPhotos } from "./WorkPhotos";

export type WorkEditorActions = {
  save: (values: WorkFormValues) => Promise<SaveWorkState>;
  remove: (id: string) => Promise<DeleteWorkState | void>;
  prepareUpload: (request: {
    workId: string;
    type: string;
    size: number;
  }) => Promise<PrepareUploadResult>;
};

type WorkEditorProps = {
  initial: WorkFormValues;
  /** 페이지가 서버 액션을 넘긴다. 스토리와 테스트는 가짜를 넘긴다 */
  actions: WorkEditorActions;
  /** 기본은 브라우저에서 줄여 서명 주소로 올리기. 스토리와 테스트는 가짜를 넘긴다 */
  upload?: PhotoUploader;
  /** 새 작업을 만들고 이 화면으로 왔을 때 */
  notice?: "created";
};

type Result = SaveWorkState | { status: "blocked" } | { status: "idle" };

const sameValues = (a: WorkFormValues, b: WorkFormValues) =>
  JSON.stringify(a) === JSON.stringify(b);

// 작업 만들기/고치기 화면 (docs/adr/0015: JS 를 전제로 한다. 사진 줄이기와 업로드가 브라우저에서 돈다).
// - 상태는 이 화면 하나의 useReducer (editor-state). 저장은 서버 액션 하나에 화면 상태를 그대로 보낸다
// - 틀린 칸은 서버 결과로 한 번에 모두 표시하고, 첫 오류 칸으로 포커스. 결과는 role=status
// - 사진을 올리는 중이면 저장을 막는다. 저장하지 않은 변경이 있으면 페이지를 떠날 때 브라우저가 묻는다
// - 새 작업은 저장하면 그 작업의 편집 주소로 바꾼다 (새로 고쳐도 같은 작업)
// 시안에 없는 화면이라 기존 Field / 버튼 / 토큰만 쓴다
export function WorkEditor({
  initial,
  actions,
  upload,
  notice,
}: WorkEditorProps) {
  const t = useTranslations("AdminWorks");
  const categories = useTranslations("Works.categories");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, dispatch] = useReducer(
    editorReducer,
    initial,
    (values): EditorState => ({ ...values, slugTouched: !values.isNew }),
  );
  const [saved, setSaved] = useState(initial);
  const [result, setResult] = useState<Result>({ status: "idle" });
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const uploader = useMemo(
    () => upload ?? createPhotoUploader(actions.prepareUpload),
    [upload, actions.prepareUpload],
  );

  const values = toFormValues(state);
  const dirty = !sameValues(values, saved);
  const errors = result.status === "invalid" ? result.errors : {};
  const firstError = firstWorkErrorField(errors);

  // 저장 결과가 올 때마다 첫 오류 칸으로
  useEffect(() => {
    if (!firstError) return;
    const control = formRef.current?.elements.namedItem(firstError);
    if (control instanceof HTMLElement) control.focus();
  }, [result, firstError]);

  // 저장하지 않은 변경이나 올리는 중인 사진이 있으면 떠나기 전에 묻는다
  useEffect(() => {
    if (!dirty && !uploading) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, uploading]);

  const onBusyChange = useCallback((busy: boolean) => setUploading(busy), []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    if (uploading) {
      setResult({ status: "blocked" });
      return;
    }
    const sent = values;
    startTransition(async () => {
      let next: SaveWorkState;
      try {
        next = await actions.save(sent);
      } catch {
        next = { status: "error", code: "unavailable" };
      }
      setResult(next);
      if (next.status !== "saved") return;
      setSaved({ ...sent, isNew: false });
      dispatch({ type: "saved" });
      if (sent.isNew) router.replace(`/admin/works/${next.id}?created=1`);
      else router.refresh();
    });
  };

  const fieldError = (name: WorkFieldName) => {
    const error = errors[name];
    return (
      error &&
      t(`errors.${name}.${error.code}`, {
        max: "max" in error ? error.max : 0,
      })
    );
  };

  const status = pending
    ? t("editor.saving")
    : result.status === "saved"
      ? t("editor.saved")
      : result.status === "invalid"
        ? t("editor.invalid", { count: Object.keys(errors).length })
        : result.status === "error"
          ? t(`failures.${result.code}`)
          : result.status === "blocked"
            ? t("editor.waitUploads")
            : notice === "created" && !dirty
              ? t("editor.created")
              : "";
  const failed =
    result.status === "invalid" ||
    result.status === "error" ||
    result.status === "blocked";

  const isNew = saved.isNew;
  const canPreview = !isNew && saved.published;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 self-start text-body text-grey-70 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-70"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {t("editor.back")}
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="mr-auto text-h3 text-white">
            {isNew ? t("editor.newTitle") : t("editor.editTitle")}
          </h1>
          {canPreview ? (
            <a
              href={`/work/${saved.slug}`}
              target="_blank"
              rel="noopener"
              aria-label={t("editor.previewLabel")}
              className={buttonStyles({ variant: "outline" })}
            >
              {t("editor.preview")}
              <ExternalLink aria-hidden />
            </a>
          ) : (
            !isNew && (
              <p className="text-body text-grey-50">
                {t("editor.previewHint")}
              </p>
            )
          )}
          {!isNew && (
            <DeleteWorkDialog
              title={saved.titleKo}
              photoCount={saved.photos.length}
              onConfirm={() => actions.remove(saved.id)}
            />
          )}
        </div>
      </div>

      <form
        ref={formRef}
        onSubmit={submit}
        noValidate
        aria-label={t("editor.form")}
        className="flex flex-col gap-12.5"
      >
        <section
          aria-labelledby="work-basics"
          className="flex flex-col gap-7.5"
        >
          <h2 id="work-basics" className="text-h4 text-white">
            {t("editor.basics")}
          </h2>
          <div className="grid gap-7.5 lg:grid-cols-2 lg:gap-10">
            {(["titleKo", "titleEn"] as const).map((name) => (
              <Field
                key={name}
                label={t(`editor.${name}`)}
                error={fieldError(name)}
              >
                {(props) => (
                  <Input
                    {...props}
                    name={name}
                    required
                    value={state[name]}
                    onChange={(event) =>
                      dispatch({
                        type: "setText",
                        field: name,
                        value: event.target.value,
                      })
                    }
                  />
                )}
              </Field>
            ))}
            <Field
              label={t("editor.slug")}
              hint={
                <>
                  {t("editor.slugHint", { slug: state.slug || "…" })}
                  <br />
                  {t("editor.slugRule")}
                </>
              }
              error={fieldError("slug")}
            >
              {(props) => (
                <Input
                  {...props}
                  name="slug"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={state.slug}
                  onChange={(event) =>
                    dispatch({
                      type: "setText",
                      field: "slug",
                      value: event.target.value,
                    })
                  }
                />
              )}
            </Field>
            <Field label={t("editor.category")} error={fieldError("category")}>
              {(props) => (
                <Select
                  {...props}
                  name="category"
                  required
                  placeholder={t("editor.categoryPlaceholder")}
                  value={state.category}
                  onChange={(event) =>
                    dispatch({
                      type: "setText",
                      field: "category",
                      value: event.target.value,
                    })
                  }
                >
                  {workCategories.map((category) => (
                    <option key={category} value={category}>
                      {categories(`${category}.name`)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field
              label={t("editor.date")}
              hint={t("editor.dateHint")}
              error={fieldError("date")}
            >
              {(props) => (
                <Input
                  {...props}
                  name="date"
                  type="month"
                  required
                  placeholder="2024-05"
                  value={state.date}
                  onChange={(event) =>
                    dispatch({
                      type: "setText",
                      field: "date",
                      value: event.target.value,
                    })
                  }
                />
              )}
            </Field>
            <div className="flex items-start gap-3 lg:col-span-2">
              <input
                id="work-published"
                type="checkbox"
                name="published"
                checked={state.published}
                onChange={(event) =>
                  dispatch({
                    type: "setPublished",
                    value: event.target.checked,
                  })
                }
                aria-describedby="work-published-hint"
                className="mt-0.5 size-5 shrink-0 cursor-pointer accent-purple-55"
              />
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="work-published"
                  className="cursor-pointer text-label text-grey-90"
                >
                  {t("editor.published")}
                </label>
                <p id="work-published-hint" className="text-body text-grey-50">
                  {t("editor.publishedHint")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <WorkPhotos
          workId={state.id}
          photos={state.photos}
          coverSrc={state.coverSrc}
          dispatch={dispatch}
          upload={uploader}
          error={fieldError("photos")}
          onBusyChange={onBusyChange}
        />

        <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-4 border-t border-dark-12 bg-dark-03 py-4">
          <button
            type="submit"
            aria-disabled={pending || undefined}
            className={buttonStyles({
              className: "aria-disabled:cursor-wait aria-disabled:opacity-50",
            })}
          >
            {t("editor.save")}
          </button>
          <p
            role="status"
            className={cx(
              "text-body",
              failed ? "text-purple-80" : "text-grey-70",
            )}
          >
            {status}
          </p>
          {dirty && !pending && (
            <p className="text-body text-grey-50">{t("editor.unsaved")}</p>
          )}
        </div>
      </form>
    </div>
  );
}
