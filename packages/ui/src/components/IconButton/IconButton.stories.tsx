import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { IconButton } from "./IconButton";
import { Add, Gear, Edit } from "../Icon";

const meta = {
  title: "Componentes/IconButton",
  component: IconButton,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    label: "Adicionar",
    icon: <Add size={18} />,
    size: "md",
    variant: "ghost",
    onClick: fn(),
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "touch"] },
    variant: { control: "inline-radio", options: ["ghost", "subtle"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ghost: Story = { args: { variant: "ghost" } };
export const Subtle: Story = { args: { variant: "subtle" } };

export const Tamanhos: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <IconButton {...args} size="sm" icon={<Edit size={16} />} label="Editar" />
      <IconButton {...args} size="md" icon={<Gear size={18} />} label="Configurações" />
      <IconButton {...args} size="touch" icon={<Add size={22} />} label="Adicionar" />
    </div>
  ),
};

// Alvo de toque de 48px para uso em campo.
export const Touch: Story = { args: { size: "touch", icon: <Add size={22} />, label: "Nova página" } };

export const Disabled: Story = { args: { disabled: true } };

export const TesteDeClique: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole("button", { name: /adicionar/i });
    await userEvent.click(btn);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
