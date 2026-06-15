import { Field, TextField, Select, SwatchPicker, Badge, type Swatch, type SelectOption } from "@blustar/ui";
import { useEditorStore } from "@blustar/core";

const COLOR_SWATCHES: Swatch[] = [
  { value: "", label: "Padrão", color: "transparent" },
  { value: "var(--bs-text)", label: "Branco" },
  { value: "var(--bs-text-muted)", label: "Cinza" },
  { value: "var(--bs-brand)", label: "Turquesa" },
  { value: "var(--bs-azul-profundo)", label: "Navy" },
  { value: "var(--bs-surface-2)", label: "Surface" },
];
const VARIANT_OPTS: SelectOption[] = [
  { label: "Primary", value: "primary" },
  { label: "Secondary", value: "secondary" },
  { label: "Ghost", value: "ghost" },
];

/**
 * Editor do MASTER de um template (no inspector). Edita os slots → `updateMaster`
 * /`updateMasterText` → propaga para TODAS as instâncias (exceto slots com
 * override). Texto coalescido = 1 entrada de undo por burst.
 */
export function MasterEditor({ templateName }: { templateName: string }) {
  const master = useEditorStore((s) => s.document.templates.masters[templateName]);
  // Quantas instâncias deste master existem no documento (propagação alvo).
  const instanceCount = useEditorStore((s) =>
    Object.values(s.document.entities.layers).filter(
      (l) => l.type === "component" && l.templateName === templateName,
    ).length,
  );
  if (!master) return null;

  const setText = (slot: string, patch: Record<string, unknown>) =>
    useEditorStore.getState().updateMasterText(templateName, slot, patch as never);
  const set = (slot: string, patch: Record<string, unknown>) =>
    useEditorStore.getState().updateMaster(templateName, slot, patch as never);

  const slots = Object.values(master.layers).filter((l) => l.type !== "group");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--bs-space-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--bs-space-2)", flexWrap: "wrap" }}>
        <Badge variant="brand" leftIcon="◇">Master · {master.label}</Badge>
        <Badge variant="neutral">{instanceCount} {instanceCount === 1 ? "instância" : "instâncias"}</Badge>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "var(--bs-text-subtle)" }}>
        Editar aqui propaga para todas as instâncias.
      </p>

      {slots.map((slot) => (
        <div key={slot.id} style={{ display: "flex", flexDirection: "column", gap: "var(--bs-space-2)", borderTop: "1px solid var(--bs-border)", paddingTop: "var(--bs-space-3)" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--bs-text-muted)" }}>{slot.name}</span>

          {slot.type === "text" && (
            <>
              <TextField value={slot.text} onChange={(e) => setText(slot.id, { text: e.target.value })} aria-label={`${slot.name} texto`} />
              <SwatchPicker swatches={COLOR_SWATCHES} value={slot.style?.color ?? ""} onChange={(c) => set(slot.id, { style: { ...slot.style, color: c } })} aria-label={`${slot.name} cor`} />
            </>
          )}

          {slot.type === "button" && (
            <>
              <TextField value={slot.label} onChange={(e) => setText(slot.id, { label: e.target.value })} aria-label={`${slot.name} label`} />
              <Select options={VARIANT_OPTS} value={slot.variant} onChange={(v) => set(slot.id, { variant: v })} aria-label={`${slot.name} variante`} />
            </>
          )}

          {slot.type === "shape" && (
            <SwatchPicker swatches={COLOR_SWATCHES} value={slot.style?.background ?? ""} onChange={(c) => set(slot.id, { style: { ...slot.style, background: c } })} aria-label={`${slot.name} cor`} />
          )}
        </div>
      ))}
    </div>
  );
}
