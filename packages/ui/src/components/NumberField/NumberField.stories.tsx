import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, userEvent, within } from "@storybook/test";
import { NumberField } from "./NumberField";

const meta = {
  title: "Componentes/NumberField",
  component: NumberField,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled() {
  const [n, setN] = useState(12);
  return (
    <div style={{ width: 200 }}>
      <NumberField value={n} onChange={setN} min={1} max={24} suffix="colunas" aria-label="Colunas" />
      <p style={{ color: "var(--bs-text-muted)", marginTop: 8 }}>Valor: {n}</p>
    </div>
  );
}

export const Colunas: Story = { render: () => <Controlled /> };

export const Incrementa: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Aumentar" }));
    await expect(canvas.getByLabelText("Colunas")).toHaveValue(13);
  },
};
