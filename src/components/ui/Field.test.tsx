import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Field, Input, Select, Textarea } from "./Field";

describe("Field", () => {
  it("라벨과 입력이 연결되고 입력할 수 있다", async () => {
    const user = userEvent.setup();
    render(
      <Field label="이름">
        {(p) => <Input {...p} placeholder="홍길동" />}
      </Field>,
    );
    const input = screen.getByLabelText("이름");
    expect(input).toHaveAttribute("placeholder", "홍길동");
    await user.type(input, "Machum");
    expect(input).toHaveValue("Machum");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("오류가 있으면 aria-invalid 와 설명(힌트 + 오류)이 읽힌다", () => {
    render(
      <Field
        label="이메일"
        hint="답장을 받을 주소"
        error="이메일 형식이 아닙니다"
      >
        {(p) => <Input {...p} type="email" />}
      </Field>,
    );
    const input = screen.getByLabelText("이메일");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "답장을 받을 주소 이메일 형식이 아닙니다",
    );
  });

  it("Tab 으로 Input → Textarea → Select 순서로 이동한다", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Field label="이름">{(p) => <Input {...p} />}</Field>
        <Field label="메시지">{(p) => <Textarea {...p} />}</Field>
        <Field label="촬영 종류">
          {(p) => (
            <Select {...p} placeholder="선택">
              <option value="portrait">인물</option>
            </Select>
          )}
        </Field>
      </>,
    );
    await user.tab();
    expect(screen.getByLabelText("이름")).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText("메시지")).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText("촬영 종류")).toHaveFocus();
  });

  it("Textarea 는 기본 4줄이다", () => {
    render(<Field label="메시지">{(p) => <Textarea {...p} />}</Field>);
    expect(screen.getByLabelText("메시지")).toHaveAttribute("rows", "4");
  });

  it("Select 는 placeholder 로 시작하고 항목을 고를 수 있다", async () => {
    const user = userEvent.setup();
    render(
      <Field label="촬영 종류">
        {(p) => (
          <Select {...p} placeholder="선택해 주세요">
            <option value="portrait">인물</option>
            <option value="event">행사</option>
          </Select>
        )}
      </Field>,
    );
    const select = screen.getByLabelText("촬영 종류");
    expect(select).toHaveValue("");
    expect(
      screen.getByRole("option", { name: "선택해 주세요" }),
    ).toBeDisabled();
    await user.selectOptions(select, "event");
    expect(select).toHaveValue("event");
  });

  it("비활성 입력은 Tab 포커스를 받지 않는다", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Field label="잠김">{(p) => <Input {...p} disabled />}</Field>
        <Field label="열림">{(p) => <Input {...p} />}</Field>
      </>,
    );
    await user.tab();
    expect(screen.getByLabelText("열림")).toHaveFocus();
  });
});
