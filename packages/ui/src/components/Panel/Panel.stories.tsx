import type { Meta, StoryObj } from "@storybook/react";
import { Panel } from "./Panel";
import { IconButton } from "../IconButton";
import { Add } from "../Icon";

const meta = {
  title: "Componentes/Panel",
  component: Panel,
  parameters: { layout: "padded", backgrounds: { default: "black" } },
  tags: ["autodocs"],
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComCabecalho: Story = {
  render: () => (
    <div style={{ height: 280, width: 260 }}>
      <Panel
        title="Pages"
        actions={<IconButton size="sm" label="Nova página" icon={<Add size={16} />} />}
      >
        <ul style={{ listStyle: "none", margin: 0, padding: 8, color: "var(--bs-text-muted)" }}>
          <li style={{ padding: "8px 4px" }}>Introduction</li>
          <li style={{ padding: "8px 4px" }}>Foundations</li>
          <li style={{ padding: "8px 4px" }}>Color</li>
        </ul>
      </Panel>
    </div>
  ),
};

export const SemCabecalho: Story = {
  render: () => (
    <div style={{ height: 200, width: 260 }}>
      <Panel>
        <p style={{ padding: 12, color: "var(--bs-text-muted)" }}>Conteúdo do painel.</p>
      </Panel>
    </div>
  ),
};
