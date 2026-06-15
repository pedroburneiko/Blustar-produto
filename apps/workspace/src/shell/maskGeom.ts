import { useEditorStore, type MaskBox } from "@blustar/core";

/** Dimensões em px. */
export interface Size {
  w: number;
  h: number;
}

/** "Fill" (cover): cobre o frame cortando o excesso; centralizado. */
export function coverBox(frame: Size, nat: Size): MaskBox {
  const s = Math.max(frame.w / nat.w, frame.h / nat.h);
  const w = nat.w * s;
  const h = nat.h * s;
  return { x: (frame.w - w) / 2, y: (frame.h - h) / 2, w, h };
}

/** "Fit" (contain): a imagem inteira cabe no frame; centralizada. */
export function fitBox(frame: Size, nat: Size): MaskBox {
  const s = Math.min(frame.w / nat.w, frame.h / nat.h);
  const w = nat.w * s;
  const h = nat.h * s;
  return { x: (frame.w - w) / 2, y: (frame.h - h) / 2, w, h };
}

/** "Center": mantém o tamanho atual da caixa, apenas recentraliza no frame. */
export function centerBox(frame: Size, box: MaskBox): MaskBox {
  return { ...box, x: (frame.w - box.w) / 2, y: (frame.h - box.h) / 2 };
}

/** Caixa derivada de um crop salvo (offset/scale sobre o natural). */
export function cropBox(nat: Size, offsetX: number, offsetY: number, scale: number): MaskBox {
  return { x: offsetX, y: offsetY, w: nat.w * scale, h: nat.h * scale };
}

/**
 * Commita a edição de máscara em andamento no documento (1 entrada de undo) e
 * sai do modo de edição. Sem geometria/natural resolvidos, apenas sai.
 */
export function commitMaskEdit(): void {
  const st = useEditorStore.getState();
  const me = st.ui.maskEdit;
  if (me?.box && me.nat) {
    st.setLayerMask(me.layerId, {
      fit: "crop",
      scale: me.box.w / me.nat.w,
      offsetX: me.box.x,
      offsetY: me.box.y,
    });
  }
  st.endMaskEdit();
}
