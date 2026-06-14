import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, userEvent, within } from "@storybook/test";
import { SwatchPicker } from "./SwatchPicker";

const meta = {
  title: "Componentes/SwatchPicker",
  component: SwatchPicker,
  parameters: { layout: "padded", backgrounds: { default: "dark" } },
  tags: ["autodocs"],
} satisfies Meta<typeof SwatchPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const swatches = [
  { value: "var(--bs-text)", label: "Branco" },
  { value: "var(--bs-brand)", label: "Turquesa" },
  { value: "var(--bs-azul-profundo)", label: "Navy" },
  { value: "var(--bs-surface-2)", label: "Surface" },
];

function Controlled() {
  const [v, setV] = useState("var(--bs-brand)");
  return <SwatchPicker swatches={swatches} value={v} onChange={setV} aria-label="Cor" />;
}

export const Paleta: Story = { render: () => <Controlled /> };

export const Seleciona: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const navy = canvas.getByRole("radio", { name: "Navy" });
    await userEvent.click(navy);
    await expect(navy).toHaveAttribute("aria-checked", "true");
  },
};
