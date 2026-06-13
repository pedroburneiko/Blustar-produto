import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, fn, within } from "@storybook/test";
import { CopyField } from "./CopyField";

const meta = {
  title: "Componentes/CopyField",
  component: CopyField,
  parameters: { layout: "centered", backgrounds: { default: "dark" } },
  tags: ["autodocs"],
  args: { value: "blustar-token-9f3a-21cd-7b40", width: 360, onCopy: fn() },
} satisfies Meta<typeof CopyField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const Estreito: Story = { args: { width: 240, value: "abc-123" } };

export const Touch: Story = { args: { touch: true } };

export const ValorLongo: Story = {
  args: { value: "blustar-token-9f3a-21cd-7b40-aa12-zz98-longo-pra-truncar", width: 360 },
};

export const TesteDeCopia: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole("button");
    await userEvent.click(btn);
    await expect(args.onCopy).toHaveBeenCalledWith(args.value);
  },
};
