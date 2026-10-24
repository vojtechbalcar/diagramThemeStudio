# M6A accounts and private saved sets

**Goal:** Build the first v2 slice: Clerk accounts and private Postgres-backed saved themes. The user chose this slice and will configure services afterward. Public gallery, additional diagram types and line-map views remain later v2 work.

**Architecture:** Preserve the version-1 TokenSet and anonymous editor. Store private, versioned documents in Postgres through Drizzle; derive ownership exclusively from Clerk's server session. Keep validation/service/HTTP boundaries independent from React, with lazy server-only database access. Add a conditional Clerk provider, a saved-set library and explicit Save/Update/Save a copy controls. Reopen saved themes through the authenticated API; URL fragments keep local draft behavior and retain their public format.

**Tech stack:** Existing Next/React/Zod/Radix/CSS system plus the roadmap's Clerk, Drizzle and PostgreSQL driver/tooling. No external account provisioning or deployment. Work on `m6-accounts-saved-sets`, based on `883a495`; commit and push each completed feature.

## 1. Saved-set storage and API
- [x] Add failing unit tests for invalid/empty sets, owner isolation, revision conflicts, bounded requests, malformed cursors and failure responses.
- [x] Add `src/lib/saved-sets/model.ts`, `service.ts`, `http.ts`: validated DTOs/cursors, metadata, authenticated CRUD service, JSON-body bounds and same-origin mutations. Read responses are private/no-store; unexpected failures never return database details.
- [x] Add `src/lib/server/db-schema.ts`, `db.ts`, `saved-sets.ts`: lazy Postgres connection, indexed owner-scoped queries, atomic revision updates/deletes and keyset pagination.
- [x] Add Drizzle migration/config and `.env.example`; document `DATABASE_URL`, Clerk keys and migration commands. No build-time connection is required.
- [x] Add API routes at `/api/sets` and `/api/sets/[id]`, deriving the user from Clerk before opening a database connection.
- [x] Verify tests/build/lint; commit and push (`fbfab7a`).

## 2. Conditional accounts
- [x] Add browser coverage for missing configuration, anonymous access and preserved editor functionality.
- [x] Add a conditional provider/context and Clerk proxy integration. Missing keys leave the editor usable and expose a clear library access state; private endpoints fail closed.
- [x] Style sign-in controls with the graphics manual's ink, square corners, typography and focus rules. Add saved-set navigation and account access without overflowing the phone band.
- [x] Verify; commit and push (`81934cc`, including the private library).

## 3. Library and editor integration
- [x] Add failing browser tests for loading/saving/updating/copying/deleting, conflict and network recovery, stale async results, remote-set opening, draft precedence and narrow keyboard flows.
- [x] Add `/sets` library with private paginated rows, empty/loading/error states, sign-in/sign-out controls and confirmed deletion. Reset user-specific state on account changes.
- [x] Add Save dialog. Send a captured theme snapshot; preserve newer edits during the request. Use saved revisions for conflict detection and offer Save a copy after conflicts.
- [x] Reopen through `/editor?set=<id>`; validated fragments take precedence over the server copy, while query revisions preserve conflict detection across reload. Ignore slow responses after newer edits/navigation.
- [x] Update `design.md` with saved-set/library/account behavior and `README.md` with service setup and exact verification limits.
- [x] Verify; commit and push.

## Completion
- [x] Independently review storage/authorization and UI/lifecycle; fix substantive findings.
- [x] Unit tests, production build, lint and browser integration tests pass. Add a real-Postgres integration test path/CI service; distinguish configured integration checks from tests that need external services.
- [x] Record that live Clerk/Postgres service configuration is deferred by the user; do not claim a live account session was verified without keys.
- [x] Push final changes, verify GitHub matches local head and the working tree is clean.

## Verification record

- Storage/API passed independent spec and quality review. The Unicode persistence finding was reproduced and fixed before commit.
- Account/library and editor lifecycle passed independent spec and quality review, followed by final integration review. Regression tests reproduce and cover phone duplicate saves, save completion after navigation, navigation before submitting a dialog, invalid-fragment fallback, focus return, and phone visibility.
- Real-Postgres tests are implemented but were not run locally: `TEST_DATABASE_URL` is absent. Live Clerk sign-in, production service configuration and cross-device persistence remain unverified, as the user explicitly deferred configuration. Browser account/CRUD flows use network mocks without a server authentication bypass.
- GitHub rejected uploading `.github/workflows/verify.yml` because the saved OAuth login lacks workflow scope. The configuration is preserved in `docs/ci/verify.yml` with activation instructions in README; no CI run is claimed.
- The initial full browser run passed 48/51. Two landing checks raced automatic preset cycling during cold rendering, and the multi-diagram focus check exceeded its total 30-second budget on the loaded machine. Holding the initial landing preset made those checks deterministic; all nine landing/focus checks passed serially afterward. The final fresh production run passed all 52 tests with one worker and the default time budgets.

Final checks (24 October 2026):
- `pnpm test`: 179 passed, 3 real-Postgres tests skipped.
- `pnpm exec playwright test --workers=1`: 52 passed against a fresh production build; the extra 320px Sets/mode-control viewport assertions also passed in a targeted rerun.
- `pnpm lint`: ESLint and TypeScript passed.
- Real unconfigured endpoints: `/api/account` returned 200 with unavailable/signed-out state; `/api/sets` returned 503 with friendly configuration guidance. Both used `private, no-store`.
- Storage/API and accounts/library were committed and pushed individually (`fbfab7a`, `81934cc`). Editor save/reopen and verification documentation form the final feature commit.
- The shared preview snapshot timed out twice; visual inspection used the repository's Playwright screenshots.
