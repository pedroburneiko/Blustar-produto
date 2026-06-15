import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, userEvent, within } from "@storybook/test";
import { Menu } from "./Menu";

const meta = {
  title: "Componentes/Menu",
  component: Menu,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

import type { MenuEntry } from "./Menu";

const PAGE_ITEMS: MenuEntry[] = [
  { label: "Renomear", onSelect: () => {} },
  { label: "Adicionar sub-página", onSelect: () => {} },
  { label: "Duplicar", onSelect: () => {}, shortcut: "⌘D" },
  "separator",
  { label: "Excluir", onSelect: () => {}, shortcut: "del", danger: true },
];

// Catálogo agrupado por categoria — exercita os cabeçalhos de seção.
const CATALOG_ITEMS: MenuEntry[] = [
  { header: "Layout" },
  { label: "Hero", onSelect: () => {} },
  { label: "Card", onSelect: () => {} },
  { header: "Conteúdo" },
  { label: "CTA", onSelect: () => {} },
];

function Demo({ items = PAGE_ITEMS }: { items?: MenuEntry[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div>
      <button
        type="button"
        onClick={(e) => {
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setPos({ x: r.left, y: r.bottom + 4 });
          setOpen(true);
        }}
        style={{ padding: "8px 12px", background: "var(--bs-surface)", color: "var(--bs-text)", border: "1px solid var(--bs-border)", borderRadius: 8 }}
      >
        Abrir menu
      </button>
      <Menu
        open={open}
        onClose={() => setOpen(false)}
        position={pos}
        aria-label="Ações da página"
        items={items}
      />
    </div>
  );
}

export const Padrao: Story = { render: () => <Demo /> };

export const ComCabecalhos: Story = { render: () => <Demo items={CATALOG_ITEMS} /> };

export const Abre: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Abrir menu" }));
    await expect(await canvas.findByRole("menu")).toBeInTheDocument();
  },
};
