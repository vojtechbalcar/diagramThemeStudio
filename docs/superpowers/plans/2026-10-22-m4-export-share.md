# M4 export and share implementation plan

**Goal:** Complete `CLAUDE.md` milestone 4 using the existing approved export design in `design.md` §3.7–3.8.

**Architecture:** Pure serializers produce Mermaid config, init directive, initialize call and JSON from the same variables and alpha backdrop as the preview. A versioned, compressed URL fragment carries the complete validated `TokenSet`. Client hooks restore/synchronize URL state and guard asynchronous work against newer edits/navigation. A Radix export drawer contains the title block, four keyboard-accessible output tabs and clipboard actions.

**Tech stack:** Existing Next.js/React/TypeScript/Radix/Zod stack; native Compression Streams, no new dependencies.

The user authorized M4 and retains the preference to commit and push each finished feature. Execute inline on `m4-export-share`, based on completed M3. Keep M5 focus mode and landing-page work out of scope.

## Feature 1 — Export serializers
- [ ] Add `src/test/export.test.ts`; observe failure for the missing serializer.
- [ ] Add `src/lib/theme/export.ts`: current-surface config, `%%{init: …}%%`, `mermaid.initialize(…);`, formatted config JSON. Preserve unmapped roles as derived and make HTML-label behaviour match the preview.
- [ ] Verify unit tests, build and lint; commit and push.

## Feature 2 — URL codec
- [ ] Add `src/test/url.test.ts`; observe failures for the missing codec.
- [ ] Add `src/lib/state/url.ts` with `#lw=1.<base64url-deflate>` fragments, full `TokenSetSchema` validation, unknown-version errors, bounded compressed/decompressed sizes and Unicode round trips.
- [ ] Add canonical current-origin share URL generation, preserving the editor route while excluding unrelated search/hash data.
- [ ] Verify unit tests, build and lint; commit and push.

## Feature 3 — Export drawer
- [ ] Add Playwright export tests before UI implementation.
- [ ] Add `export-drawer.tsx`, `title-block.tsx` and reusable output/copy controls, with Radix tabs, right-side framed drawer, readable code, copy feedback and nonblocking contrast warnings.
- [ ] Add Export and Share link actions to the system band; keep every action available on phones without overflowing the 48px band.
- [ ] Document M4 decisions in `design.md`, including raw JSON's config shape, sharing format and responsive header/tab layout.
- [ ] Verify keyboard focus, clipboard output, pending/failed contrast and light/dark/narrow drawer states; commit and push.

## Feature 4 — URL lifecycle
- [ ] Add browser coverage for shared-set restoration, reload persistence, hash navigation, malformed links and edits while encoding/decoding.
- [ ] Add a client state hook that restores only validated state, synchronizes committed edits with `history.replaceState`, ignores stale async results and leaves current state intact for invalid navigation.
- [ ] Generate clipboard share links from the latest state; never copy a stale cached result. Show actionable codec/clipboard failures in the existing toast.
- [ ] Update README and this plan with final behavior and checks; commit and push.

## Completion
- [ ] Apply `design.md` Appendix A and independent code review; correct important findings.
- [ ] `pnpm test`, `pnpm build`, `pnpm lint`, `pnpm test:e2e` pass.
- [ ] GitHub matches the local head and the working tree is clean.
