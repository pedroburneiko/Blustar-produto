import { useState } from "react";
import { Panel, Tabs } from "@blustar/ui";

/**
 * Inspector (direita) — espelha .guide-right do SPEC.
 * No M1 só a moldura: abas + grupos vazios. A edição de propriedades é M3.
 */
export function Inspector() {
  const [tab, setTab] = useState("styles");

  return (
    <Panel>
      <div style={{ padding: "var(--bs-space-3) var(--bs-space-3) 0" }}>
        <Tabs
          items={[
            { value: "styles", label: "Styles" },
            { value: "page", label: "Page" },
          ]}
          value={tab}
          onValueChange={setTab}
          aria-label="Inspector"
        />
      </div>

      <div style={{ padding: "var(--bs-space-4) var(--bs-space-3)" }}>
        {(tab === "styles" ? ["Type", "Color"] : ["Página"]).map((group) => (
          <div key={group} style={{ marginBottom: "var(--bs-space-5)" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--bs-text-subtle)",
                marginBottom: "var(--bs-space-2)",
              }}
            >
              {group}
            </div>
            <div
              style={{
                border: "1px dashed var(--bs-border)",
                borderRadius: "var(--bs-radius-sm)",
                padding: "var(--bs-space-3)",
                color: "var(--bs-text-subtle)",
                fontSize: 13,
              }}
            >
              Controles em M3.
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
