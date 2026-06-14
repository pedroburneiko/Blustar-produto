import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, userEvent, within } from "@storybook/test";
import { Toggle } from "./Toggle";

const meta = {
  title: "Componentes/Toggle",
  component: Toggle,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled({ label }: { label?: string }) {
  const [on, setOn] = useState(false);
  return (
    <div style={{ width: 240 }}>
      <Toggle checked={on} onChange={setOn} label={label} aria-label="Visível" />
    </div>
  );
}

export const Padrao: Story = { render: () => <Controlled /> };
export const ComRotulo: Story = { render: () => <Controlled label="Bloqueado" /> };

export const Alterna: Story = {
  render: () => <Controlled label="Visível" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole("switch");
    await expect(sw).toHaveAttribute("aria-checked", "false");
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute("aria-checked", "true");
  },
};
