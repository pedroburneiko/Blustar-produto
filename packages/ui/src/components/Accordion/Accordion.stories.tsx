import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Accordion } from "./Accordion";

const meta = {
  title: "Componentes/Accordion",
  component: Accordion,
  parameters: { layout: "centered", backgrounds: { default: "black" } },
  tags: ["autodocs"],
  args: {
    title: "Seção",
    defaultOpen: true,
    items: [
      { label: "Item um" },
      { label: "Item dois" },
      { label: "Item três" },
      { label: "Item quatro" },
      { label: "Item cinco" },
    ],
    onItemClick: fn(),
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Aberto: Story = {};

export const Fechado: Story = { args: { defaultOpen: false } };

export const Touch: Story = { args: { touch: true } };

export const ComItemDesabilitado: Story = {
  args: {
    items: [
      { label: "Item um" },
      { label: "Item dois (desabilitado)", disabled: true },
      { label: "Item três" },
    ],
  },
};
