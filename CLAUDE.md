# CLAUDE.md — Linework

## What this project is
**Linework** (working name) is a web app that turns a brand's design tokens into a **Mermaid diagram theme**.

User flow:
1. **Add tokens:** paste a token file (W3C DTCG JSON, CSS custom properties, or a Figma variables export), pick a preset, or edit colours by hand.
2. **Map roles:** assign tokens to Mermaid theme roles (primary fill, text, border, line, background, notes, font). Auto-map guesses from token names.
3. **Preview:** eight diagram types (flowchart, sequence, entity relationship, Gantt, State, Class, Pie, Timeline) re-render live with the theme, on a switchable surface (white / black / the brand background).
4. **Check contrast:** every text/fill pair gets a WCAG 2.x ratio and a pass / large-only / fail verdict.
5. **Export:** a Mermaid `%%{init: …}%%` directive, a `mermaid.initialize()` config, raw JSON, or a share link that encodes the whole state in the URL.

It is a **portfolio project**. Visual craft and polish matter as much as features. It has no backend in v1.

## Read before working
- **`design.md` is binding** for anything visual. Read it before you build or change UI. If a request conflicts with it, say so and propose a change to `design.md`; don't silently deviate.
- Before you call a UI task done, run through the checklist in `design.md` Appendix A.

## Stack
- Next.js (latest stable, App Router), React, TypeScript `strict`.
- Tailwind CSS v4, with design tokens from `design.md` §7 exposed via `@theme`. Don't use default palette, radius or shadow utilities.
- `mermaid` (v11+), rendered **client-side only**.
- `culori` for colour parsing and conversion. Contrast maths lives in our own code (see below).
- `zod` for validating parsed token input and decoded share-link state.
- Radix primitives (Dialog, Select, Tabs, Switch) for behaviour only; style them per `design.md`. No shadcn default styles. No icon libraries; the symbols are our own SVG components (`design.md` §1.8).
- Fonts via `next/font`: Inter (variable) and JetBrains Mono.
- Tests: Vitest for pure logic, Playwright for one end-to-end happy path.
- Package manager: pnpm.

**Not in v1:** database, auth, accounts, saved sets on a server, payments. State lives in memory and in the URL. Postgres/Drizzle and Clerk come in v2 (saved sets, public gallery), so keep the domain model serialisable now so they slot in later.

## Commands
```bash
pnpm dev          # local dev server
pnpm build        # production build (must pass before a task is done)
pnpm lint         # eslint + type check
pnpm test         # vitest
pnpm test:e2e     # playwright
```

## Architecture
```
src/
  app/
    page.tsx                 # landing (design.md §3.12)
    editor/page.tsx          # the editor shell (server component wrapper)
    layout.tsx               # fonts, theme attribute, globals
    globals.css              # design tokens (§7), base styles, .lw-band
  components/
    system/                  # Band, Bullet, Arrow, ArrowTile, Symbol*, Button, Input, Toggle, Segmented
    editor/                  # TokenPanel, TokenRow, MappingPanel, Canvas, DiagramCard, ContrastList,
                             # ColourStrip, ExportDrawer, TitleBlock, ImportDialog
  lib/
    tokens/
      parse-dtcg.ts          # W3C design tokens JSON → Token[]
      parse-css.ts           # `--name: value;` → Token[]
      parse-figma.ts         # Figma variables export → Token[]
      presets.ts             # 4 original presets (never real-company palettes)
    theme/
      roles.ts               # Mermaid role definitions + text/fill pairs to check
      automap.ts             # name-based role guessing
      build-theme.ts         # (tokens, mapping) → Mermaid themeVariables
      export.ts              # init directive / initialize() / JSON strings
    contrast/
      wcag.ts                # relative luminance, ratio, verdict
    mermaid/
      render.ts              # single place that calls mermaid; queueing, ids, errors
      samples.ts             # the 4 sample diagram sources
    state/
      store.ts               # editor state (useReducer + context, or zustand if it grows)
      url.ts                 # encode/decode state ↔ URL (compressed, versioned)
  test/
```

## Domain model
```ts
type Token = {
  id: string;            // stable, generated
  path: string;          // as written by the user, e.g. "color.brand.primary"
  type: "color" | "fontFamily" | "dimension";
  value: string;         // colours normalised to #RRGGBB (alpha kept separately)
  alpha?: number;        // 0–1
  source: "dtcg" | "css" | "figma" | "manual" | "preset";
};

type Role =
  | "primaryColor" | "primaryTextColor" | "primaryBorderColor"
  | "secondaryColor" | "tertiaryColor" | "lineColor" | "background"
  | "noteBkgColor" | "noteTextColor" | "fontFamily" | "fontSize";

type Mapping = Partial<Record<Role, { tokenId: string; auto: boolean }>>;

type TokenSet = { version: 1; name: string; tokens: Token[]; mapping: Mapping; surface: "paper" | "ink" | "brand" };
```
`TokenSet` is what gets URL-encoded, and later what gets stored in Postgres. Bump `version` whenever its shape changes, and keep a decoder for every old version.

## Mermaid rules (hard-won, follow them)
- Only `theme: "base"` can be customised; always use it with `themeVariables`.
- Mermaid's theming engine accepts **hex colours only**. Normalise everything to `#RRGGBB` before it reaches Mermaid. Never pass names, `rgb()` or `oklch()`.
- Derived colours: if a role isn't mapped, leave it out rather than inventing a value. Mermaid derives some colours itself, and the UI should show the role as "Derived".
- Render through `lib/mermaid/render.ts` only. `mermaid.render(id, source)` needs a unique id per call; serialise calls (Mermaid isn't safe to render concurrently) and ignore stale results when a newer render has started.
- `securityLevel: "strict"`. Users can edit diagram source in focus mode, so never use `"loose"`.
- Call `mermaid.initialize` with the new config before each render batch; there's no per-diagram theme API apart from the init directive.
- Debounce re-renders: 120 ms after typing, at most every 50 ms during colour-picker drags (see `design.md` §4).
- Load Mermaid with dynamic `import()` inside client components; it must never run during SSR.
- Inspired by "Pele" (themeable Mermaid SVG, HN Oct 2026), but we **don't depend on it**. Only use it if its API has been checked and it clearly helps.

## Contrast rules
- WCAG 2.x relative luminance and ratio, implemented in `lib/contrast/wcag.ts`, with unit tests against known pairs (`#000`/`#FFF` = 21:1, `#777`/`#FFF` ≈ 4.48:1).
- Verdicts: ≥ 7 AAA, ≥ 4.5 AA, ≥ 3 large text / non-text only, < 3 fail.
- Pairs to check are defined in `lib/theme/roles.ts`: primaryTextColor on primaryColor, noteTextColor on noteBkgColor, lineColor on background, primaryTextColor on background, and so on.
- If a colour has alpha, composite it over the current preview surface before computing the ratio.
- Display: one decimal, `4.8:1`, always with a symbol shape. Never colour alone.

## Code conventions
- Server components by default; `"use client"` only where needed (editor, canvas, anything that touches Mermaid or the DOM).
- No `any`. Parse, don't cast: all external input (pasted files, URL state) goes through zod.
- Pure logic in `lib/` with no React imports; unit test it.
- One component per file; name files in kebab-case and export components in PascalCase.
- Styles: Tailwind utilities mapped to our tokens plus the few named classes from `design.md` (`.lw-band`, `.lw-band-2`, `.lw-inverted`). No inline hex values in components; lint for `#[0-9a-f]{3,6}` in `components/`.
- Accessibility per `design.md` §6 is part of done, not a follow-up.
- Keep dependencies minimal. Ask before adding one that isn't listed above.

## Milestones
1. **Scaffold + system:** Next app, tokens/CSS from `design.md` §7, fonts, the `system/` components (Band, Bullet, Arrow, symbols, buttons, inputs) on a `/system` specimen page that shows every element. Treat it like the manual's specimen pages.
2. **Core logic:** token parsers, presets, roles, auto-map, theme builder, WCAG module, all with tests.
3. **Editor v1:** shell layout, token panel, mapping panel, canvas with four live diagram cards, contrast list, colour strip.
4. **Export + share:** export drawer with title block, all output formats, URL state encode/decode.
5. **Polish:** motion (§4), empty/loading/error states, focus mode with leader-line annotations, responsive (§5), landing page.
6. **v2:** Optional Postgres + Drizzle + Clerk accounts/private saved sets and eight editor diagram types are implemented. Public gallery and the "line map" palette view remain later work. Pie/Timeline palettes reuse mapped fills through the shared builder; Timeline event-filter CSS is exported too. The landing page deliberately renders only the original four types.

Finish and polish one milestone before starting the next.

## Definition of done
- `pnpm build`, `pnpm lint` and `pnpm test` pass.
- Checked in light and dark mode, and on all three preview surfaces.
- `design.md` Appendix A checklist passes for any UI touched.
- Keyboard-only path works for the feature.
- No console errors or warnings in the browser.

## Working style
- For anything larger than a small fix, propose a short plan first and wait for approval.
- When you make a design decision `design.md` doesn't cover, add it to `design.md` in the same change.
- Be honest about trade-offs and unfinished parts; don't claim something works without running it.
