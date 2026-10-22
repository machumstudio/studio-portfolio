import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Field, Input, Select, Textarea } from "./Field";

const meta = {
  title: "UI/Field",
  component: Field,
  args: {
    label: "First Name",
    children: (p) => <Input {...p} placeholder="First Name" />,
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl page-x py-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextInput: Story = {};

export const WithValue: Story = {
  args: { children: (p) => <Input {...p} defaultValue="Machum" /> },
};

export const WithHintAndError: Story = {
  args: {
    label: "Email",
    hint: "We reply within one business day",
    error: "Please enter a valid email address",
    children: (p) => <Input {...p} type="email" defaultValue="machum@" />,
  },
};

export const Disabled: Story = {
  args: { children: (p) => <Input {...p} placeholder="First Name" disabled /> },
};

export const TextArea: Story = {
  args: {
    label: "Your Message",
    children: (p) => <Textarea {...p} placeholder="Message" />,
  },
};

export const SelectBox: Story = {
  args: {
    label: "Session Type",
    children: (p) => (
      <Select {...p} placeholder="Choose a session">
        <option value="portrait">Portrait</option>
        <option value="event">Event</option>
        <option value="commercial">Commercial</option>
      </Select>
    ),
  },
};

// 시안 Contact 폼 배치 (lg 부터 2열, 간격 30/50)
export const ContactForm: Story = {
  render: () => (
    <form className="grid gap-7.5 lg:grid-cols-2 lg:gap-x-12.5">
      <Field label="First Name">
        {(p) => <Input {...p} placeholder="First Name" />}
      </Field>
      <Field label="Last Name">
        {(p) => <Input {...p} placeholder="Last Name" />}
      </Field>
      <Field label="Email">
        {(p) => <Input {...p} type="email" placeholder="Email Address" />}
      </Field>
      <Field label="Phone Number">
        {(p) => <Input {...p} type="tel" placeholder="Phone Number" />}
      </Field>
      <Field label="Session Type" className="lg:col-span-2">
        {(p) => (
          <Select {...p} placeholder="Choose a session">
            <option value="portrait">Portrait</option>
            <option value="event">Event</option>
          </Select>
        )}
      </Field>
      <Field label="Your Message" className="lg:col-span-2">
        {(p) => <Textarea {...p} placeholder="Message" />}
      </Field>
    </form>
  ),
};

export const Mobile: Story = {
  ...ContactForm,
  globals: { viewport: { value: "mobile", isRotated: false } },
};

export const Laptop: Story = {
  ...ContactForm,
  globals: { viewport: { value: "laptop", isRotated: false } },
};

export const Desktop: Story = {
  ...ContactForm,
  globals: { viewport: { value: "desktop", isRotated: false } },
};
