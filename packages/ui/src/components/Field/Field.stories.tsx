import type { Meta, StoryObj } from "@storybook/react";
import { Field } from "./Field";
import { TextField } from "../TextField";

const meta = {
  title: "Componentes/Field",
  component: Field,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComRotulo: Story = {
  render: () => (
    <div style={{ width: 280 }}>
      <Field label="Nome" htmlFor="f1" hint="Identifica a camada.">
        <TextField id="f1" defaultValue="Título" />
      </Field>
    </div>
  ),
};

/** Linha (rótulo à esquerda, controle à direita) — painel Estilo Visual. */
export const Inline: Story = {
  render: () => (
    <div style={{ width: 280 }}>
      <Field label="Source" htmlFor="f2" inline hint="custom">
        <TextField id="f2" defaultValue="http://res.cloudi…" />
      </Field>
    </div>
  ),
};
