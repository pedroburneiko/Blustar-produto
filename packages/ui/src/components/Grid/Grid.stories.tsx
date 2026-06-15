import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Grid, Col } from "./Grid";

const meta = {
  title: "Fundamentos/Grid",
  component: Grid,
  parameters: { layout: "fullscreen", backgrounds: { default: "black" } },
  tags: ["autodocs"],
  args: { showOverlay: true },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Moldura de largura fixa: o Grid resolve o bp pela própria content-box. */
function Frame({ width, label, children }: { width: number; label: string; children: ReactNode }) {
  return (
    <div style={{ padding: "12px 0" }}>
      <div style={{ color: "var(--bs-text-subtle)", fontFamily: "var(--bs-font)", fontSize: 12, marginBottom: 8 }}>
        {label} — {width}px
      </div>
      <div style={{ width, border: "1px solid var(--bs-border)", borderRadius: 12 }}>{children}</div>
    </div>
  );
}

/** Mostra os 3 breakpoints lado a lado: 4 / 8 / 12 colunas conforme a largura. */
export const Breakpoints: Story = {
  render: (args) => (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 8 }}>
      <Frame width={420} label="mobile (< 640px) → 4 col">
        <Grid {...args} style={{ minHeight: 160 }} />
      </Frame>
      <Frame width={820} label="tablet (≥ 640px) → 8 col">
        <Grid {...args} style={{ minHeight: 160 }} />
      </Frame>
      <Frame width={1180} label="desktop (≥ 1024px) → 12 col">
        <Grid {...args} style={{ minHeight: 160 }} />
      </Frame>
    </div>
  ),
};

/** Redimensione o painel do Storybook para ver o grid reflowar entre os bps. */
export const Responsivo: Story = {
  render: (args) => (
    <div style={{ minHeight: 240, padding: "24px 0" }}>
      <Grid {...args} style={{ minHeight: 200 }} />
    </div>
  ),
};

export const ExemploDeUso: Story = {
  args: { showOverlay: false },
  render: (args) => (
    <div style={{ padding: "24px 0" }}>
      <Grid {...args}>
        <Col span={4} style={{ background: "var(--bs-surface)", color: "var(--bs-text-muted)", padding: 16, borderRadius: 12, fontFamily: "var(--bs-font)" }}>
          span 4
        </Col>
        <Col span={8} style={{ background: "var(--bs-surface)", color: "var(--bs-text-muted)", padding: 16, borderRadius: 12, fontFamily: "var(--bs-font)" }}>
          span 8
        </Col>
      </Grid>
    </div>
  ),
};
