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

export const Overlay12Colunas: Story = {
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
