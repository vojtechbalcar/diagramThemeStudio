# Linework

Turn design tokens into a Mermaid theme, preview eight diagram types and check their contrast. No backend or account is required.

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

Milestones 1–5 are implemented. Export an init directive, `mermaid.initialize()` call, Mermaid configuration JSON or a share link from the editor. Compressed URL fragments preserve the complete token set, mappings, name and preview surface across sharing and reloads. Sharing uploads no theme data; the optional Save action stores a private copy in Postgres.

Click a diagram to edit its Mermaid source in focus mode, inspect contrast leaders and reset it independently. Source edits stay in the current session; share links contain the theme. Phones use separate Tokens, Canvas and Export views, while tablets retain the Tokens drawer.

The editor supports Flowchart, Sequence, Entity relationship, Gantt, State, Class, Pie and Timeline. The landing page keeps a compact four-diagram proof across all four presets, with pause controls and reduced-motion support. v2 includes optional accounts and private saved sets; the public gallery and line-map palette view remain later work.

Pie slices and Timeline groups cycle the available mapped primary, secondary and tertiary fills. Primary text controls their labels; primary border controls Pie outlines. These settings and Timeline’s event-filter correction are included in every Mermaid configuration export and Live link. Contrast checks cover representative theme pairs; custom sources can use additional colours that are not audited.

## Accounts and database setup

The anonymous editor and fragment sharing work without services. To enable private saved sets:

1. Create a Clerk application and a Postgres database. Copy `.env.example` to `.env.local` and configure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` and `DATABASE_URL` privately. Use a database connection that supports Postgres transactions, with TLS configured as required by your host.
2. Run `pnpm db:migrate` to apply the committed Drizzle migration to that database. `pnpm db:generate` generates migrations after schema changes; it does not need a connection.
3. Restart development, or rebuild and restart production. The public Clerk key is embedded at build time. Configure the same variables in your hosting environment and allow its domain in Clerk.
4. Visit `/sets`, sign in, then save a theme from the editor. Saved sets are private to the Clerk user ID. Updates and deletions check revisions so another tab's newer save cannot be silently overwritten. Deleting a Clerk account does not automatically purge its saved rows; no webhook is configured in this slice.

See the [Clerk Next.js setup](https://clerk.com/docs/nextjs/getting-started/quickstart) and [Drizzle Postgres guide](https://orm.drizzle.team/docs/get-started-postgresql) for service configuration. Never commit `.env.local` or paste secrets into an issue or chat.

`TEST_DATABASE_URL` optionally enables real Postgres tests. Export it privately before `pnpm test`, or put it in `.env.local` and run `node --env-file=.env.local node_modules/vitest/vitest.mjs run src/test/saved-sets-db.test.ts`. Use a disposable test database: the suite applies migrations and removes its own test rows. It skips these tests when the variable is absent.

[docs/ci/verify.yml](docs/ci/verify.yml) is a GitHub Actions template with an isolated Postgres service; copy it into `.github/workflows/verify.yml` using a GitHub login with workflow permission to enable CI. No Clerk secrets are needed for that workflow. Browser tests mock account/API responses to exercise UI states and do not prove a live Clerk session. Verify real sign-in and cross-device persistence after configuring your services.

Read [CLAUDE.md](CLAUDE.md) for architecture and [design.md](design.md) for the binding visual specification. The [M3 plan](docs/superpowers/plans/2026-10-22-m3-editor.md), [M4 plan](docs/superpowers/plans/2026-10-22-m4-export-share.md), [M5 plan](docs/superpowers/plans/2026-10-22-m5-polish.md) [M6A plan](docs/superpowers/plans/2026-10-22-m6-accounts-saved-sets.md) and [extra diagrams plan](docs/superpowers/plans/2026-10-24-extra-diagrams.md) record implementation and verification.
