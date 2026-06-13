import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, fn, within } from "@storybook/test";
import { Select } from "./Select";

const options = [
  { label: "Item 1", value: "1" },
  { label: "Item 2", value: "2" },
  { label: "Item 3", value: "3" },
  { label: "Item 4", value: "4" },
  { label: "Item 5", value: "5" },
  { label: "Item 6", value: "6" },
];

const meta = {
  title: "Componentes/Select",
  component: Select,
  parameters: { layout: "centered", backgrounds: { default: "subtle" } },
  tags: ["autodocs"],
  args: { options, placeholder: "Dropdown", onChange: fn() },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const ComSelecao: Story = { args: { defaultValue: "2" } };

export const Desabilitado: Story = { args: { disabled: true } };

export const Touch: Story = { args: { size: "touch" } };

export const ComItemDesabilitado: Story = {
  args: {
    options: [
      { label: "Item 1", value: "1" },
      { label: "Item 2 (indisponível)", value: "2", disabled: true },
      { label: "Item 3", value: "3" },
    ],
  },
};

// Teste de interação: abre o menu, clica numa opção e confirma o onChange.
export const TesteAbrirESelecionar: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button");
    await userEvent.click(trigger);
    const item3 = await canvas.findByRole("option", { name: "Item 3" });
    await userEvent.click(item3);
    await expect(args.onChange).toHaveBeenCalledWith("3");
    await expect(trigger).toHaveTextContent("Item 3");
  },
};
