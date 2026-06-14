import {
  Field,
  TextField,
  NumberField,
  Toggle,
  SegmentedControl,
  SwatchPicker,
  Select,
  type Swatch,
  type SelectOption,
} from "@blustar/ui";
import { useEditorStore } from "@blustar/core";

/** Paleta CURADA (só tokens) para cor de texto / fundo. */
const COLOR_SWATCHES: Swatch[] = [
  { value: "", label: "Padrão", color: "transparent" },
  { value: "var(--bs-text)", label: "Branco" },
  { value: "var(--bs-text-muted)", label: "Cinza" },
  { value: "var(--bs-brand)", label: "Turquesa" },
  { value: "var(--bs-azul-profundo)", label: "Navy" },
  { value: "var(--bs-surface)", label: "Surface" },
  { value: "var(--bs-surface-2)", label: "Surface 2" },
];

/** Escala de tipografia do DS (curada — sem px arbitrário). */
const SIZE_OPTS: SelectOption[] = [
  { label: "Padrão", value: "" },
  { label: "H1", value: "3.5rem" },
  { label: "H2", value: "2.5rem" },
  { label: "H3", value: "2rem" },
  { label: "H4", value: "1.5rem" },
  { label: "Body", value: "1rem" },
  { label: "Caption", value: "0.875rem" },
];

const WEIGHT_OPTS: SelectOption[] = [
  { label: "Regular", value: "400" },
  { label: "Semibold", value: "600" },
  { label: "Bold", value: "700" },
];

const VARIANT_OPTS: SelectOption[] = [
  { label: "Primary", value: "primary" },
  { label: "Secondary", value: "secondary" },
  { label: "Ghost", value: "ghost" },
];

const SHAPE_OPTS: SelectOption[] = [
  { label: "Retângulo", value: "rect" },
  { label: "Elipse", value: "ellipse" },
  { label: "Linha", value: "line" },
];

const TYPE_LABEL: Record<string, string> = {
  component: "Componente",
  group: "Grupo",
  text: "Texto",
  image: "Imagem",
  shape: "Forma",
  button: "Botão",
  video: "Vídeo",
};

export function LayerInspector({ layerId }: { layerId: string }) {
  const layer = useEditorStore((s) => s.document.entities.layers[layerId]);
  if (!layer) return null;

  // Ações (mutam o documento → entram no undo, ao contrário da seleção).
  const s = useEditorStore.getState();
  const setLayer = (patch: Parameters<typeof s.updateLayer>[1]) => useEditorStore.getState().updateLayer(layerId, patch);
  // Texto livre = coalescido (1 entrada por burst de digitação).
  const setText = (patch: Parameters<typeof s.updateLayerText>[1]) => useEditorStore.getState().updateLayerText(layerId, patch);
  const setStyle = (patch: Parameters<typeof s.updateLayerStyle>[1]) => useEditorStore.getState().updateLayerStyle(layerId, patch);
  const setBox = (patch: Parameters<typeof s.updateLayerBox>[1]) => useEditorStore.getState().updateLayerBox(layerId, patch);
  const setFont = (patch: Parameters<typeof s.updateLayerFont>[1]) => useEditorStore.getState().updateLayerFont(layerId, patch);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--bs-space-5)", padding: "var(--bs-space-4) var(--bs-space-3)" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--bs-text-subtle)" }}>
          {TYPE_LABEL[layer.type] ?? layer.type}
        </span>
        <TextField value={layer.name} onChange={(e) => setText({ name: e.target.value })} aria-label="Nome da camada" />
      </div>

      {/* Geral */}
      <Section title="Geral">
        <Toggle label="Visível" checked={layer.visible} onChange={(v) => setLayer({ visible: v })} />
        <Toggle label="Bloqueado" checked={layer.locked} onChange={(v) => setLayer({ locked: v })} />
      </Section>

      {/* Por tipo */}
      {layer.type === "text" && (
        <>
          <Section title="Texto">
            <Field label="Conteúdo">
              <TextField multiline value={layer.text} onChange={(e) => setText({ text: e.target.value })} aria-label="Conteúdo" />
            </Field>
          </Section>
          <Section title="Tipografia">
            <Field label="Tamanho">
              <Select options={SIZE_OPTS} value={layer.font?.size ?? ""} onChange={(v) => setFont({ size: v })} aria-label="Tamanho" />
            </Field>
            <Field label="Peso">
              <Select options={WEIGHT_OPTS} value={String(layer.font?.weight ?? "")} onChange={(v) => setFont({ weight: Number(v) })} aria-label="Peso" />
            </Field>
          </Section>
          <Section title="Cor">
            <Field label="Cor do texto">
              <SwatchPicker swatches={COLOR_SWATCHES} value={layer.style?.color ?? ""} onChange={(v) => setStyle({ color: v })} aria-label="Cor do texto" />
            </Field>
          </Section>
        </>
      )}

      {layer.type === "button" && (
        <Section title="Botão">
          <Field label="Label">
            <TextField value={layer.label} onChange={(e) => setText({ label: e.target.value })} aria-label="Label" />
          </Field>
          <Field label="Variante">
            <Select options={VARIANT_OPTS} value={layer.variant} onChange={(v) => setLayer({ variant: v })} aria-label="Variante" />
          </Field>
        </Section>
      )}

      {layer.type === "shape" && (
        <Section title="Forma">
          <Field label="Tipo">
            <Select options={SHAPE_OPTS} value={layer.shape} onChange={(v) => setLayer({ shape: v as "rect" | "ellipse" | "line" })} aria-label="Tipo de forma" />
          </Field>
          <Field label="Cor">
            <SwatchPicker swatches={COLOR_SWATCHES} value={layer.style?.background ?? ""} onChange={(v) => setStyle({ background: v })} aria-label="Cor de fundo" />
          </Field>
        </Section>
      )}

      {layer.type === "component" && (
        <Section title="Layout">
          <Field label="Colunas">
            <NumberField value={layer.box?.cols ?? 1} onChange={(n) => setBox({ cols: n })} min={1} max={24} suffix="col" aria-label="Colunas" />
          </Field>
          <Field label="Fundo">
            <SegmentedControl
              options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }]}
              value={layer.style?.bgMode ?? "light"}
              onChange={(v) => setStyle({ bgMode: v as "light" | "dark" })}
              aria-label="Modo de fundo"
            />
          </Field>
          <Field label="Cor de fundo">
            <SwatchPicker swatches={COLOR_SWATCHES} value={layer.style?.background ?? ""} onChange={(v) => setStyle({ background: v })} aria-label="Cor de fundo" />
          </Field>
        </Section>
      )}

      {layer.type === "group" && (
        <Section title="Layout">
          <Field label="Colunas">
            <NumberField value={layer.box?.cols ?? 1} onChange={(n) => setBox({ cols: n })} min={1} max={12} suffix="col" aria-label="Colunas" />
          </Field>
        </Section>
      )}

      {(layer.type === "image" || layer.type === "video") && (
        <Section title="Mídia">
          <Field label="Fonte (URL)">
            <TextField value={layer.src} onChange={(e) => setText({ src: e.target.value })} placeholder="https://…" aria-label="URL da mídia" />
          </Field>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--bs-space-3)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--bs-text-subtle)" }}>
        {title}
      </div>
      {children}
    </div>
  );
}
