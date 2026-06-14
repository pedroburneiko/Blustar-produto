import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { NavItem } from "./NavItem";
import { Home, Guide, Grid4 } from "../Icon";

const meta = {
  title: "Componentes/NavItem",
  component: NavItem,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { icon: <Home size={18} />, children: "Home", active: false, onClick: fn() },
  argTypes: { active: { control: "boolean" } },
} satisfies Meta<typeof NavItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ativo: Story = { args: { active: true } };
export const Inativo: Story = { args: { active: false } };

// Rail com vários itens (board navigation do produto).
export const Rail: Story = {
  render: () => (
    <div style={{ width: 200, display: "flex", flexDirection: "column", gap: 4 }}>
      <NavItem icon={<Home size={18} />} active>
        Home
      </NavItem>
      <NavItem icon={<Guide size={18} />}>Guide</NavItem>
      <NavItem icon={<Grid4 size={18} />}>Design System</NavItem>
    </div>
  ),
};
