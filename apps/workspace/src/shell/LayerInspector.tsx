import { useState } from "react";
import {
  Field,
  TextField,
  NumberField,
  Toggle,
  SegmentedControl,
  SwatchPicker,
  Select,
  Button,
  type Swatch,
  type SelectOption,
} from "@blustar/ui";
import { useEditorStore, resolveGrid, breakpointForWidth, type Breakpoint } from "@blustar/core";
import { MasterEditor } from "./MasterEditor";
import { centerBox, commitMaskEdit } from "./maskGeom";

const BP_OPTS: { value: Breakpoint; label: string }[] = [
  { value: "mobile", label: "Mobile" },
  { value: "tablet", label: "Tablet" },
  { value: "desktop", label: "Desktop" },
];
const BP_LABEL: Record<Breakpoint, string> = { mobile: "Mobile", tablet: "Tablet", desktop: "Desktop" };

/**
 * Painel de grid responsivo de um container (grupo/instância). O seletor escolhe
 * QUAL breakpoint editar (estado local, efêmero); o chip mostra o bp ATIVO
 * derivado da largura do artboard. Os campos editam a config do bp selecionado
 * via setLayerGrid (1 entrada de undo por rajada). O valor exibido é o efetivo
 * (override do doc se houver, senão default do token); o hint diz a origem.
 */
function GridPanel({ layerId }: { layerId: string }) {
  const box = useEditorStore((s) => s.document.entities.layers[layerId]?.box);
  const artboardWidth = useEditorStore((s) => s.ui.artboardWidth);
  const activeBp: Breakpoint = artboardWidth == null ? "desktop" : breakpointForWidth(artboardWidth);
  const [editBp, setEditBp] = useState<Breakpoint>(activeBp);

  const eff = resolveGrid(box, editBp); // valores efetivos do bp em edição
  const ov = box?.grid?.[editBp];
  const setGrid = (patch: Parameters<ReturnType<typeof useEditorStore.getState>["setLayerGrid"]>[2]) =>
    useEditorStore.getState().setLayerGrid(layerId, editBp, patch);

  const origin = (has: boolean) => (has ? "override" : "padrão do token");

  return (
    <Section title="Grid responsivo">
      <SegmentedControl
        options={BP_OPTS}
        value={editBp}
        onChange={(v) => setEditBp(v as Breakpoint)}
        touch
        aria-label="Breakpoint a editar"
      />
      <div
        style={{
          fontSize: 12,
          color: "var(--bs-text-subtle)",
          display: "flex",
          alignItems: "center",
          gap: "var(--bs-space-2)",
        }}
      >
        <span
          aria-hidden
          style={{ width: 8, height: 8, borderRadius: "var(--bs-radius-full)", background: "var(--bs-brand)" }}
        />
        Ativo: <strong style={{ color: "var(--bs-text)" }}>{BP_LABEL[activeBp]}</strong>
        {artboardWidth != null && <> · {Math.round(artboardWidth)}px</>}
      </div>

      <Field label="Colunas" hint={origin(ov?.columns != null)}>
        <NumberField
          value={eff.columns}
          onChange={(n) => setGrid({ columns: n })}
          min={1}
          max={24}
          suffix="col"
          aria-label="Colunas"
        />
      </Field>
      <Field label="Tipo">
        <Select
          options={[{ label: "Stretch", value: "stretch" }]}
          value="stretch"
          onChange={() => setGrid({ type: "stretch" })}
          aria-label="Tipo de grid"
        />
      </Field>
      <Field label="Margem" hint={origin(ov?.margin != null)}>
        <NumberField
          value={eff.margin}
          onChange={(n) => setGrid({ margin: n })}
          min={0}
          suffix="px"
          aria-label="Margem"
        />
      </Field>
      <Field label="Gutter" hint={origin(ov?.gutter != null)}>
        <NumberField
          value={eff.gutter}
          onChange={(n) => setGrid({ gutter: n })}
          min={0}
          suffix="px"
          aria-label="Gutter"
        />
      </Field>
    </Section>
  );
}

const FIT_OPTS: SelectOption[] = [
  { label: "Fill", value: "fill" },
  { label: "Fit", value: "fit" },
  { label: "Crop", value: "crop" },
];

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
        <>
          <GridPanel layerId={layerId} />
          <Section title="Aparência">
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
        </>
      )}

      {layer.type === "component" && layer.templateName && (
        <MasterEditor templateName={layer.templateName} />
      )}

      {layer.type === "group" && <GridPanel layerId={layerId} />}

      {(layer.type === "image" || layer.type === "video") && (
        <Section title="Mídia">
          <Field label="Fonte (URL)">
            <TextField value={layer.src} onChange={(e) => setText({ src: e.target.value })} placeholder="https://…" aria-label="URL da mídia" />
          </Field>
          {layer.type === "image" && <MaskControls layerId={layerId} />}
        </Section>
      )}
    </div>
  );
}

/**
 * Controles de máscara de imagem (M6.E). Fill/Fit definem o modo na hora; Crop
 * abre a edição direta (duplo-clique no canvas tem o mesmo efeito); Centralizar
 * recentraliza a imagem enquanto se edita. A dica orienta o gesto no canvas.
 */
function MaskControls({ layerId }: { layerId: string }) {
  const layer = useEditorStore((s) => s.document.entities.layers[layerId]);
  const editing = useEditorStore((s) => s.ui.maskEdit?.layerId === layerId);
  if (!layer || layer.type !== "image") return null;
  const fitValue = editing ? "crop" : (layer.mask?.fit ?? "fill");

  function setFit(v: string) {
    const s = useEditorStore.getState();
    if (v === "crop") {
      s.setLayerMask(layerId, { fit: "crop" });
      if (!editing && layer && layer.rect) s.beginMaskEdit(layerId, { w: layer.rect.w, h: layer.rect.h });
      return;
    }
    s.setLayerMask(layerId, { fit: v as "fill" | "fit" });
    if (editing) s.endMaskEdit();
  }

  function center() {
    const s = useEditorStore.getState();
    const me = s.ui.maskEdit;
    if (me?.box) s.setMaskBox(centerBox(me.frame, me.box));
  }

  return (
    <>
      <Field label="Preenchimento">
        <SegmentedControl options={FIT_OPTS} value={fitValue} onChange={setFit} aria-label="Modo de preenchimento" />
      </Field>
      {editing ? (
        <div style={{ display: "flex", gap: "var(--bs-space-2)" }}>
          <Button variant="secondary" onClick={center}>Centralizar</Button>
          <Button variant="primary" onClick={() => commitMaskEdit()}>Concluir</Button>
        </div>
      ) : (
        <span style={{ fontSize: 11, color: "var(--bs-text-subtle)" }}>
          Duplo-clique na foto para ajustar o recorte.
        </span>
      )}
    </>
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
