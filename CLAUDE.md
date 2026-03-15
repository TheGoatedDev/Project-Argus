# Project Argus

Self-hosted OSINT aggregation platform.

## Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: Next.js 16 (App Router, Turbopack), TanStack Query, Zustand, React Flow, shadcn/ui, Tailwind v4
- **API**: Hono on Node.js
- **Database**: PostgreSQL + Drizzle ORM
- **Testing**: Vitest (unit/integration with PGlite), Playwright (e2e)
- **Tooling**: Biome (lint/format), Husky + lint-staged, tsdown (bundling)

## Workspace Structure

```
packages/types       → Shared TypeScript types + Zod schemas
packages/db          → Drizzle schema, client, test utils
packages/scraper-sdk → Scraper plugin contract + registry
tooling/typescript   → @argus/typescript-config (shared tsconfig.base.json)
apps/api             → Hono API server (port 3001)
apps/web             → Next.js frontend (port 3000)
e2e/                 → Playwright E2E tests
scrapers/            → Individual scraper implementations
```

## Commands

```bash
pnpm turbo build          # Build all packages and apps
pnpm turbo typecheck      # Type-check all packages
pnpm turbo test           # Run all tests
pnpm turbo dev            # Start dev servers
pnpm format-and-lint      # Biome check --write
```

## Database Migrations

Drizzle ORM migrations live in `packages/db/drizzle/`. Run from the `packages/db` directory:

```bash
pnpm db:generate          # Generate migration from schema changes
pnpm db:migrate           # Apply pending migrations
pnpm db:baseline          # Mark all migrations as applied (for existing DBs)
pnpm db:push              # Push schema directly (dev only, skips migrations)
```

**Workflow for schema changes:**
1. Edit `packages/db/src/schema.ts`
2. Run `pnpm db:generate` to create an incremental migration
3. If the migration needs custom SQL (triggers, functions), append it to the generated `.sql` file
4. Run `pnpm db:migrate` to apply
5. Commit the migration file

**Note:** `entities.search_vector` uses a custom `tsvector` Drizzle column type (`packages/db/src/schema.ts`) and is populated by a trigger (defined in the initial migration and `test-utils.ts`). Do not change it to `text()` — this breaks full-text search.

## Key Decisions

- Zod schemas generated via `drizzle-zod@0.8.3` (`createInsertSchema`/`createSelectSchema`). Peer dep says zod@^3 but works with Zod v4 at runtime. Migrate to `drizzle-orm/zod` when drizzle-orm v1.0 ships stable.
- `isolatedDeclarations` is disabled in shared packages (tsdown generates dts)
- `.next` types excluded from tsc (Next.js validator.ts has stale ts-expect-error directives)
- shadcn/ui component lint rules relaxed in biome overrides
- AppType exported from `@argus/api/app-type` for Hono RPC client in frontend
