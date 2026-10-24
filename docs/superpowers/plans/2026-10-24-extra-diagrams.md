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
- [ ] Add failing registry/source/browser tests, then Class index 6, representative members/relationships/note source, resolved class-text checks and SVG anchors.
- [ ] Reject class-only URL/callback/CSS overrides while accepting actual class declarations.
- [ ] Verify unit/browser checks and lint; commit/push Class.

## Pie
- [ ] Add failing tests for index 7, pie source, palette fill adapters and 70% slice-opacity contrast.
- [ ] Add Pie sample and parser header. Extend shared theme variable typing and palette adapter; reuse mapped fill roles in 12 slice slots and mapped primary text/border for legend/title/labels/outlines.
- [ ] Add three percentage/fill checks plus surface title/legend checks and real slice anchors. Export JSON/init/initialize and Mermaid Live use the same adapter.
- [ ] Verify actual computed SVG opacity/colours and exported config, source edit/reset, unit checks and lint; commit/push Pie.

## Timeline
- [ ] Add failing tests for index 8, timeline source and colour-scale adapters.
- [ ] Add three-group sample, mapped scale/label slots and trusted shared CSS that removes the default event brightness filter in both preview and export.
- [ ] Add text/fill checks and anchors matching actual section colour indexes; verify actual task/event fills and text on all three surfaces.
- [ ] Verify source edit/reset, phone/keyboard flow, unit/browser checks and lint; commit/push Timeline.

## Completion
- [ ] Update binding `design.md`, README and project architecture/copy for eight editor types and four landing examples.
- [ ] Independent review; fix substantive findings and rerun relevant checks.
- [ ] Fresh full unit suite, production build/browser regression suite and lint. Record actual counts and the optional DB skips.
- [ ] Push final head; verify remote SHA matches and tree is clean.
