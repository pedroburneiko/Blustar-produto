import type { Meta, StoryObj } from "@storybook/react";
import { Alert } from "./Alert";

const meta = {
  title: "Componentes/Alert",
  component: Alert,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { variant: "success", children: "Tudo certo, sucesso!" },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sucesso: Story = {};

export const Erro: Story = {
  args: { variant: "error", children: "Algo deu errado. Tente novamente." },
};

export const Aviso: Story = {
  args: { variant: "warning", children: "Atenção: confira os dados antes de continuar." },
};

export const TextoLongo: Story = {
  args: {
    children: "Operação concluída com sucesso. Seus dados foram salvos e já estão disponíveis.",
    width: 480,
  },
};

export const LarguraTotal: Story = {
  parameters: { layout: "padded" },
  args: { width: "100%", children: "Ocupa toda a largura do container." },
};
