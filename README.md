# Linework

Turn design tokens into a Mermaid theme, preview four diagram types and check their contrast. No backend or account is required.

```sh
pnpm install
pnpm dev
```

Open `/editor` to import W3C token JSON, CSS custom properties or Figma variables; start from a preset; edit colours and typography; and map tokens to diagram roles. `/system` contains the graphics standards specimen.

```sh
pnpm test       # pure logic and render-queue tests
pnpm build     # production build
pnpm lint      # design-system lint, ESLint and TypeScript
pnpm test:e2e  # Chromium integration tests against the production build
```

Milestones 1–5 are implemented. Export an init directive, `mermaid.initialize()` call, Mermaid configuration JSON or a share link from the editor. Compressed URL fragments preserve the complete token set, mappings, name and preview surface across sharing and reloads; no data is uploaded to a backend.

Click a diagram to edit its Mermaid source in focus mode, inspect contrast leaders and reset it independently. Source edits stay in the current session; share links contain the theme. Phones use separate Tokens, Canvas and Export views, while tablets retain the Tokens drawer.

The landing page previews all four presets with pause controls and reduced-motion support. The next milestone is v2: saved sets, accounts and a public gallery.

Read [CLAUDE.md](CLAUDE.md) for architecture and [design.md](design.md) for the binding visual specification. The [M3 plan](docs/superpowers/plans/2026-10-22-m3-editor.md), [M4 plan](docs/superpowers/plans/2026-10-22-m4-export-share.md) and [M5 plan](docs/superpowers/plans/2026-10-22-m5-polish.md) record implementation and verification.
