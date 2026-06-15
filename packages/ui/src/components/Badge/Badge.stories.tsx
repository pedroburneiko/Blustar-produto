import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta = {
  title: "Componentes/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = { args: { children: "Rascunho" } };

export const Brand: Story = { args: { variant: "brand", children: "Card", leftIcon: "◇" } };

export const Variantes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Badge>Neutral</Badge>
      <Badge variant="brand" leftIcon="◇">Componente</Badge>
      <Badge variant="brand">6 instâncias</Badge>
    </div>
  ),
};
