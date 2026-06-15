import { Field, TextField, Select, SwatchPicker, Button, type Swatch, type SelectOption } from "@blustar/ui";
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
 * Editor de OVERRIDE de um slot (sub-seleção). Edita só ESTA instância; valor
 * efetivo = master + override. "Voltar ao master" remove o override (volta a
 * herdar). Texto coalescido = 1 entrada de undo.
 */
export function SlotOverrideEditor({ instanceId, slotKey }: { instanceId: string; slotKey: string }) {
  const inst = useEditorStore((s) => s.document.entities.layers[instanceId]);
  const master = useEditorStore((s) => (inst?.type === "component" ? s.document.templates.masters[inst.templateName] : undefined));
  if (!inst || inst.type !== "component" || !master) return null;

  const masterSlot = master.layers[slotKey];
  if (!masterSlot) return null;
  const ov = inst.overrides?.[slotKey];
  const overridden = ov != null && Object.keys(ov).length > 0;

  const setText = (patch: Record<string, unknown>) => useEditorStore.getState().setSlotOverrideText(instanceId, slotKey, patch as never);
  const set = (patch: Record<string, unknown>) => useEditorStore.getState().setSlotOverride(instanceId, slotKey, patch as never);

  const text = ov?.text ?? (masterSlot.type === "text" ? masterSlot.text : "");
  const label = ov?.label ?? (masterSlot.type === "button" ? masterSlot.label : "");
  const variant = ov?.variant ?? (masterSlot.type === "button" ? masterSlot.variant : "primary");
  const color = ov?.style?.color ?? masterSlot.style?.color ?? "";
  const background = ov?.style?.background ?? masterSlot.style?.background ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--bs-space-4)", padding: "var(--bs-space-4) var(--bs-space-3)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--bs-text-subtle)" }}>
            Slot · {master.label}
          </span>
          <strong style={{ color: "var(--bs-text)" }}>{masterSlot.name}</strong>
        </div>
        <Button variant="ghost" size="sm" onClick={() => useEditorStore.getState().clearSlot()}>
          Voltar
        </Button>
      </div>

      <p style={{ margin: 0, fontSize: 12, color: overridden ? "var(--bs-brand)" : "var(--bs-text-subtle)" }}>
        {overridden ? "Sobrescrito nesta instância." : "Herdando do master."}
      </p>

      {masterSlot.type === "text" && (
        <>
          <Field label="Texto">
            <TextField value={text} onChange={(e) => setText({ text: e.target.value })} aria-label="Texto do slot" />
          </Field>
          <Field label="Cor">
            <SwatchPicker swatches={COLOR_SWATCHES} value={color} onChange={(c) => set({ style: { color: c } })} aria-label="Cor do slot" />
          </Field>
        </>
      )}

      {masterSlot.type === "button" && (
        <>
          <Field label="Label">
            <TextField value={label} onChange={(e) => setText({ label: e.target.value })} aria-label="Label do slot" />
          </Field>
          <Field label="Variante">
            <Select options={VARIANT_OPTS} value={variant} onChange={(v) => set({ variant: v })} aria-label="Variante do slot" />
          </Field>
        </>
      )}

      {masterSlot.type === "shape" && (
        <Field label="Cor">
          <SwatchPicker swatches={COLOR_SWATCHES} value={background} onChange={(c) => set({ style: { background: c } })} aria-label="Cor do slot" />
        </Field>
      )}

      {overridden && (
        <Button variant="secondary" size="sm" onClick={() => useEditorStore.getState().clearSlotOverride(instanceId, slotKey)}>
          Voltar ao master
        </Button>
      )}
    </div>
  );
}
