import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, userEvent, within } from "@storybook/test";
import { Tabs } from "./Tabs";

const meta = {
  title: "Componentes/Tabs",
  component: Tabs,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  { value: "pages", label: "Pages" },
  { value: "layers", label: "Layers" },
  { value: "assets", label: "Assets" },
];

function Controlled() {
  const [value, setValue] = useState("pages");
  return (
    <div style={{ minWidth: 320 }}>
      <Tabs items={items} value={value} onValueChange={setValue} aria-label="Seções" />
      <p style={{ color: "var(--bs-text-muted)", marginTop: 12 }}>Ativa: {value}</p>
    </div>
  );
}

export const Padrao: Story = {
  render: () => <Controlled />,
};

export const TrocaDeAba: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const layers = canvas.getByRole("tab", { name: "Layers" });
    await userEvent.click(layers);
    await expect(layers).toHaveAttribute("aria-selected", "true");
  },
};
