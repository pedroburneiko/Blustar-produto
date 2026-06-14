import type { Meta, StoryObj } from "@storybook/react";
import { Toolbar } from "./Toolbar";
import { IconButton } from "../IconButton";
import { Undo, Redo } from "../Icon";

const meta = {
  title: "Componentes/Toolbar",
  component: Toolbar,
  parameters: { layout: "fullscreen", backgrounds: { default: "black" } },
  tags: ["autodocs"],
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Topbar: Story = {
  render: () => (
    <Toolbar
      left={<strong style={{ color: "var(--bs-text)" }}>Brand System BluStar</strong>}
      right={
        <>
          <IconButton size="sm" label="Desfazer" icon={<Undo size={18} />} />
          <IconButton size="sm" label="Refazer" icon={<Redo size={18} />} />
        </>
      }
    />
  ),
};

export const ComCentro: Story = {
  render: () => (
    <Toolbar
      left={<strong style={{ color: "var(--bs-text)" }}>Documento</strong>}
      center="Guide / Introduction"
      right={<IconButton size="sm" label="Desfazer" icon={<Undo size={18} />} />}
    />
  ),
};
