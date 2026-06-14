import { useState } from "react";
import { Button, Menu, Add, type MenuEntry } from "@blustar/ui";
import { useEditorStore, useShallow } from "@blustar/core";

/** Posição padrão de uma nova instância no canvas (reposicionável por drag). */
const DEFAULT_RECT = { x: 80, y: 80, w: 320, h: 220 };

/**
 * Botão "Template" → abre um menu com o catálogo (por categoria) e insere a
 * instância selecionada na página, já selecionada para edição/manipulação.
 */
export function InsertTemplateButton({ pageId }: { pageId: string }) {
  const masters = useEditorStore(useShallow((s) => Object.values(s.document.templates.masters)));
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const items: MenuEntry[] = masters.map((m) => ({
    label: `${m.category} · ${m.label}`,
    onSelect: () => {
      const s = useEditorStore.getState();
      const id = s.insertComponent(pageId, m.name, { ...DEFAULT_RECT });
      if (id) s.selectLayers([id]);
    },
  }));

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<Add size={16} />}
        onClick={(e) => {
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setMenu({ x: r.left, y: r.bottom + 4 });
        }}
      >
        Template
      </Button>
      {menu && (
        <Menu open onClose={() => setMenu(null)} position={menu} items={items} aria-label="Inserir template" />
      )}
    </>
  );
}
