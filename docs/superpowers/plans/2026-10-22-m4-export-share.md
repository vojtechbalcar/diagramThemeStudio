# M4 export and share implementation plan

**Goal:** Complete `CLAUDE.md` milestone 4 using the existing approved export design in `design.md` §3.7–3.8.

**Architecture:** Pure serializers produce Mermaid config, init directive, initialize call and JSON from the same variables and alpha backdrop as the preview. A versioned, compressed URL fragment carries the complete validated `TokenSet`. Client hooks restore/synchronize URL state and guard asynchronous work against newer edits/navigation. A Radix export drawer contains the title block, four keyboard-accessible output tabs and clipboard actions.

**Tech stack:** Existing Next.js/React/TypeScript/Radix/Zod stack; native Compression Streams, no new dependencies.

The user authorized M4 and retains the preference to commit and push each finished feature. Execute inline on `m4-export-share`, based on completed M3. Keep M5 focus mode and landing-page work out of scope.

## Feature 1 — Export serializers
- [x] Add `src/test/export.test.ts`; observe failure for the missing serializer.
- [x] Add `src/lib/theme/export.ts`: current-surface config, `%%{init: …}%%`, `mermaid.initialize(…);`, formatted config JSON. Preserve unmapped roles as derived and make HTML-label behaviour match the preview.
- [x] Verify unit tests, build and lint; commit and push.

## Feature 2 — URL codec
- [x] Add `src/test/url.test.ts`; observe failures for the missing codec.
- [x] Add `src/lib/state/url.ts` with `#lw=1.<base64url-deflate>` fragments, full `TokenSetSchema` validation, unknown-version errors, bounded compressed/decompressed sizes and Unicode round trips.
- [x] Add canonical current-origin share URL generation, preserving the editor route while excluding unrelated search/hash data.
- [x] Verify unit tests, build and lint; commit and push.

## Feature 3 — Export drawer
- [x] Add Playwright export tests before UI implementation.
- [x] Add `export-drawer.tsx`, `title-block.tsx` and reusable output/copy controls, with Radix tabs, right-side framed drawer, readable code, copy feedback and nonblocking contrast warnings.
- [x] Add Export and Share link actions to the system band; keep every action available on phones without overflowing the 48px band.
- [x] Document M4 decisions in `design.md`, including raw JSON's config shape, sharing format and responsive header/tab layout.
- [x] Verify keyboard focus, clipboard output, pending/failed contrast and light/dark/narrow drawer states; commit and push.

## Feature 4 — URL lifecycle
- [x] Add browser coverage for shared-set restoration, reload persistence, hash navigation, malformed links and edits while encoding/decoding.
- [x] Add a client state hook that restores only validated state, synchronizes committed edits with `history.replaceState`, ignores stale async results and leaves current state intact for invalid navigation.
- [x] Generate clipboard share links from the latest state; never copy a stale cached result. Show actionable codec/clipboard failures in the existing toast.
- [x] Update README and this plan with final behavior and checks; commit and push.

## Completion
- [x] Apply `design.md` Appendix A and independent code review; correct important findings.
- [x] `pnpm test`, `pnpm build`, `pnpm lint`, `pnpm test:e2e` pass.
- [x] GitHub matches the local head and the working tree is clean.

## Verification record

- `pnpm test`: 17 files, 158 tests passed.
- `pnpm test:e2e`: 23 Chromium tests passed against the production build, including all existing editor tests and 10 M4 export/share cases.
- `pnpm build` and `pnpm lint`: passed. Duplicate generated `.next/types` files from concurrent development/build activity were removed before the final type check; no application workaround was added.
- Production preview: confirmed the 640px right-aligned, full-height drawer and two-column tabs. Browser coverage includes narrow dark/reduced-motion rendering, focus return, clipboard success/denial, malformed links, history navigation, delayed restoration and stale share cancellation.
- Independent review found unsafe shared font declarations and stale asynchronous header sharing. Both received regression coverage and fixes. Font validation and canonical URL credential stripping were committed separately as `69a615d`.
- Serializer and codec features were committed and pushed as `29296d7` and `be6190f`; the drawer and URL lifecycle ship together because the header and export UI consume the shared editor state hook.
