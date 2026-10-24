# Additional diagram types implementation plan

**Goal:** Add State, Class, Pie and Timeline to Linework's editor without changing saved-theme formats.

**Architecture:** Extend the existing registry, source boundary, resolved-theme contrast pairs and focus anchors. Add an explicit landing subset to avoid rendering extra charts in its four-panel proof. Add palette adapters to the shared theme builder so exported Mermaid configs reproduce the editor.

**Stack:** Existing Next/React/TypeScript, Mermaid 12.2, Zod, Vitest and Playwright. No new dependencies. Work on `m6-diagram-types`, based on `034373f`; user already approved this slice and committing/pushing completed features.

## State
- [x] Write failing registry/source tests in `src/test/diagram-types.test.ts`; generalize existing batch/count assertions to registry length.
- [x] Add State index 5 and sample in `theme/diagrams.ts`, `mermaid/samples.ts`; add source validation in `mermaid/source.ts`.
- [x] Add resolved state label/fill/transition checks in `theme/roles.ts` and selectors in `contrast-annotations.tsx`.
- [x] Add optional selected kinds to `mermaid/batch.ts` and `use-preview.ts`; use original four in `landing-preview.tsx`, with partial result typing.
- [x] Verify unit tests, production browser checks and lint; commit/push State.

## Class
- [x] Add failing registry/source/browser tests, then Class index 6, representative members/relationships/note source, resolved class-text checks and SVG anchors.
- [x] Reject class-only URL/callback/CSS overrides while accepting actual class declarations.
- [x] Verify unit/browser checks and lint; commit/push Class.

## Pie
- [x] Add failing tests for index 7, pie source, palette fill adapters and 70% slice-opacity contrast.
- [x] Add Pie sample and parser header. Extend shared theme variable typing and palette adapter; reuse mapped fill roles in 12 slice slots and mapped primary text/border for legend/title/labels/outlines.
- [x] Add three percentage/fill checks plus surface title/legend checks and real slice anchors. Export JSON/init/initialize and Mermaid Live use the same adapter.
- [x] Verify actual computed SVG opacity/colours and exported config, source edit/reset, unit checks and lint; commit/push Pie.

## Timeline
- [x] Add failing tests for index 8, timeline source and colour-scale adapters.
- [x] Add three-group sample, mapped scale/label slots and trusted shared CSS that removes the default event brightness filter in both preview and export.
- [x] Add text/fill checks and anchors matching actual section colour indexes; verify actual task/event fills and text on all three surfaces.
- [x] Verify source edit/reset, phone/keyboard flow, unit/browser checks and lint; commit/push Timeline.

## Completion
- [x] Update binding `design.md`, README and project architecture/copy for eight editor types and four landing examples.
- [x] Independent review; fix substantive findings and rerun relevant checks.
- [x] Fresh full unit suite, production build/browser regression suite and lint. Record actual counts and the optional DB skips.
- [x] Push final head; verify remote SHA matches and tree is clean.

## Verification — 24 Oct 2026

- `pnpm test`: 189 passed; 3 optional real-Postgres tests skipped because `TEST_DATABASE_URL` is absent.
- `pnpm exec playwright test --workers=1`: fresh production build and all 58 Chromium tests passed. Includes all eight editor previews, four landing previews, source/error/reset flows, export/share/saved-set regressions, real SVG colours on Paper/Ink/Brand, and 320px light/dark keyboard/copy flows.
- `pnpm lint`: ESLint and TypeScript passed. Generated numbered `.next/types` duplicates from filesystem synchronization were removed when they appeared; no application workaround was added.
- Inspected State, Class, Pie and Timeline focus screenshots and Timeline phone screenshots. Independent review approved each feature; State command-boundary, label-opacity and anchor issues, plus Class CSS-class assignment variants, were fixed and verified.
- State, Class and Pie were committed and pushed separately as `7032743`, `b51bd42` and `e1f6b2f`. Timeline and the final integration/documentation checks are recorded in the finishing feature commit.
- Saved-theme schema remains v1. Live Clerk/Postgres configuration and real-session checks remain the user's follow-up from M6A. Custom diagram sources are checked against representative theme pairs, not a full per-shape SVG audit.
