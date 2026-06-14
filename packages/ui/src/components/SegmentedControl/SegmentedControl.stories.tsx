import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, userEvent, within } from "@storybook/test";
import { SegmentedControl } from "./SegmentedControl";

const meta = {
  title: "Componentes/SegmentedControl",
  component: SegmentedControl,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled() {
  const [v, setV] = useState("light");
  return (
    <SegmentedControl
      options={[
        { value: "dark", label: "Dark" },
        { value: "light", label: "Light" },
      ]}
      value={v}
      onChange={setV}
      aria-label="Fundo"
    />
  );
}

export const Padrao: Story = { render: () => <Controlled /> };

export const Seleciona: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dark = canvas.getByRole("radio", { name: "Dark" });
    await userEvent.click(dark);
    await expect(dark).toHaveAttribute("aria-checked", "true");
  },
};
