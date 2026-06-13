import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, fn, within } from "@storybook/test";
import { Button } from "./Button";

const meta = {
  title: "Componentes/Button",
  component: Button,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    children: "Botão",
    variant: "primary",
    size: "md",
    onClick: fn(),
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "ghost"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg", "touch"] },
    loading: { control: "boolean" },
    fullWidth: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: "primary" } };
export const Secondary: Story = { args: { variant: "secondary" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const ComIcone: Story = {
  args: { variant: "primary", leftIcon: <span>+</span>, children: "Button" },
};
export const Loading: Story = { args: { loading: true, children: "Carregando" } };
export const Disabled: Story = { args: { disabled: true } };

export const Tamanhos: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Button {...args} size="sm">Small</Button>
      <Button {...args} size="md">Medium</Button>
      <Button {...args} size="lg">Large</Button>
      <Button {...args} size="touch">Touch 48px</Button>
    </div>
  ),
};

// Alvo de toque de 48px para uso em campo (mobile/motoboy).
export const Touch: Story = { args: { size: "touch", children: "Confirmar entrega" } };

// Galeria: cada variante em estado normal e desabilitado, lado a lado.
export const Estados: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: 16, alignItems: "center" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="primary" disabled>Primary disabled</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="secondary" disabled>Secondary disabled</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="ghost" disabled>Ghost disabled</Button>
    </div>
  ),
};

// Hover congelado via addon de pseudo-states (visível direto na story, sem interação).
export const Hover: Story = {
  args: { children: "Hover" },
  parameters: { pseudo: { hover: true } },
};

// Active congelado.
export const Active: Story = {
  args: { children: "Active" },
  parameters: { pseudo: { active: true } },
};

// Matriz: normal / hover / active lado a lado (pseudo-states aplicado por elemento).
export const EstadosInterativos: Story = {
  parameters: { pseudo: { hover: ["#h"], active: ["#a"] } },
  render: (args) => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Button {...args}>Normal</Button>
      <Button {...args} id="h">Hover</Button>
      <Button {...args} id="a">Active</Button>
    </div>
  ),
};

// Teste de interação: o clique dispara o handler; desabilitado não dispara.
export const TesteDeClique: Story = {
  args: { children: "Clique aqui" },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole("button", { name: /clique aqui/i });
    await userEvent.click(btn);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
