import type { DiagramKind } from "@/lib/theme/diagrams";

/** Fixed sources deliberately exercise the roles in the contrast lists. */
export const SAMPLES: Readonly<Record<DiagramKind, string>> = {
  flowchart: `flowchart LR
    subgraph studio[Theme studio]
      A[Add tokens] --> B{Map roles}
      B -->|Review| C[Check contrast]
      C --> D[Ready to export]
    end`,
  sequence: `sequenceDiagram
    participant Designer
    participant Linework
    Designer->>Linework: Add brand tokens
    Note over Linework: One theme, four diagrams
    Linework-->>Designer: Preview and contrast
    Designer->>Linework: Refine the palette`,
  er: `erDiagram
    TOKEN-SET ||--|{ TOKEN : contains
    TOKEN ||--o{ MAPPING : supplies
    TOKEN-SET ||--|{ DIAGRAM : themes
    TOKEN {
      string path
      string value
    }
    MAPPING {
      string role
    }`,
  gantt: `gantt
    dateFormat YYYY-MM-DD
    axisFormat %d %b
    tickInterval 1day
    section Theme
    Collect tokens :a, 2026-10-19, 2d
    Map roles :b, after a, 2d
    Check contrast :c, after b, 2d
    Export :d, after c, 1d`,
  state: `stateDiagram-v2
    [*] --> Draft
    Draft --> Review: Map roles
    Review --> Ready: Check contrast
    Ready --> [*]
    note right of Review: Refine the palette`,
};
