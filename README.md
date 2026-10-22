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

Milestones 1–3 are implemented. Export formats and URL sharing are next (M4), followed by focus-mode source editing, final motion/responsive polish and the landing page (M5). Editor state currently lives in memory.

Read [CLAUDE.md](CLAUDE.md) for architecture and [design.md](design.md) for the binding visual specification. The [M3 plan](docs/superpowers/plans/2026-10-22-m3-editor.md) records implementation and verification.
