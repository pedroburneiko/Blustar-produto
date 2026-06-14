import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { TextField } from "./TextField";

const meta = {
  title: "Componentes/TextField",
  component: TextField,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  render: () => (
    <div style={{ width: 280 }}>
      <TextField placeholder="Digite…" defaultValue="Título" aria-label="Texto" />
    </div>
  ),
};

export const Multiline: Story = {
  render: () => (
    <div style={{ width: 280 }}>
      <TextField multiline placeholder="Conteúdo…" defaultValue="Parágrafo de exemplo." aria-label="Conteúdo" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ width: 280 }}>
      <TextField disabled defaultValue="Bloqueado" aria-label="Texto" />
    </div>
  ),
};

export const Digitar: Story = {
  render: () => (
    <div style={{ width: 280 }}>
      <TextField aria-label="Texto" placeholder="Digite aqui" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Texto");
    await userEvent.type(input, "BluStar");
    await expect(input).toHaveValue("BluStar");
  },
};
