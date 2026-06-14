import { forwardRef } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const base =
  "w-full bg-surface text-ink placeholder:text-subtle border border-line rounded-md " +
  "px-3 py-2 text-sm transition-colors outline-none " +
  "focus-visible:ring-2 focus-visible:ring-focus focus-visible:border-transparent " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Quando true, renderiza um <textarea> multilinha. */
  multiline?: false;
}

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  multiline: true;
}

/**
 * Campo de texto do Blustar Design System. `multiline` → textarea.
 */
export const TextField = forwardRef<HTMLInputElement | HTMLTextAreaElement, TextFieldProps | TextAreaFieldProps>(
  ({ className = "", ...props }, ref) => {
    const cls = [base, className].filter(Boolean).join(" ");
    if (props.multiline) {
      const { multiline: _ml, ...rest } = props;
      return (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          className={[cls, "resize-y min-h-[72px]"].join(" ")}
          {...rest}
        />
      );
    }
    const { multiline: _ml, ...rest } = props;
    return <input ref={ref as React.Ref<HTMLInputElement>} className={cls} {...rest} />;
  },
);

TextField.displayName = "TextField";
