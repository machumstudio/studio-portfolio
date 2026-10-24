import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Field, Input } from "@/components/ui/Field";
import { ContactMessage } from "./ContactMessage";

// 실제 폼은 features/inquiry 의 InquiryForm (Features/Inquiry/InquiryForm 스토리). 여기서는 자리만 본다
const meta = {
  title: "Sections/ContactMessage",
  component: ContactMessage,
  args: {
    form: (
      <Field label="First Name">
        {(p) => <Input {...p} placeholder="First Name" />}
      </Field>
    ),
  },
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="page-x">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContactMessage>;

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
