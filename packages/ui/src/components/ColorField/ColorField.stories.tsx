import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ColorField } from "./ColorField";

const meta = {
  title: "Componentes/ColorField",
  component: ColorField,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof ColorField>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled() {
  const [c, setC] = useState("#3fcce3");
  return (
    <div style={{ width: 220 }}>
      <ColorField value={c} onChange={setC} aria-label="Cor da marca" />
      <p style={{ color: "var(--bs-text-muted)", marginTop: 8 }}>Valor: {c}</p>
    </div>
  );
}

export const Padrao: Story = { render: () => <Controlled /> };
