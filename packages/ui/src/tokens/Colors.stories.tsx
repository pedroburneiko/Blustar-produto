import type { Meta, StoryObj } from "@storybook/react";
import { palette, colors } from "@blustar/tokens";

const meta: Meta = { title: "Fundamentos/Cores" };
export default meta;
type Story = StoryObj;

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div style={{ width: 140 }}>
      <div
        style={{
          height: 72,
          borderRadius: "var(--bs-radius-md)",
          background: value,
          border: "1px solid var(--bs-border)",
        }}
      />
      <div style={{ fontSize: 13, marginTop: 6, fontWeight: 600, color: "var(--bs-text)" }}>
        {name}
      </div>
      <div style={{ fontSize: 12, color: "var(--bs-text-subtle)" }}>{value}</div>
    </div>
  );
}

function Group({ title, group }: { title: string; group: Record<string, string> }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h3 style={{ fontFamily: "var(--bs-font)", marginBottom: 12, color: "var(--bs-text)" }}>
        {title}
      </h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {Object.entries(group).map(([k, v]) => (
          <Swatch key={k} name={k} value={v} />
        ))}
      </div>
    </section>
  );
}

const wrap = { fontFamily: "var(--bs-font)", background: "var(--bs-bg)", padding: 24 } as const;

/** Tokens semânticos — o que se deve usar na aplicação. */
export const Semanticos: Story = {
  render: () => (
    <div style={wrap}>
      <Group title="Semânticos (use estes)" group={colors as unknown as Record<string, string>} />
    </div>
  ),
};

/** Primitivos nomeados — referência; prefira os tokens semânticos. */
export const Primitivos: Story = {
  render: () => (
    <div style={wrap}>
      <Group title="Secundária — azul-* (turquesa = primária)" group={palette.azul} />
      <Group title="Neutros — gray-* (escala oficial)" group={palette.gray as unknown as Record<string, string>} />
      <Group title="Status — green" group={palette.green} />
      <Group title="Status — orange" group={palette.orange} />
      <Group title="Status — yellow (sem papel de status por ora)" group={palette.yellow} />
      <Group title="Status — red" group={palette.red} />
    </div>
  ),
};
