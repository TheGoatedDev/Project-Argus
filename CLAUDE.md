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
apps/api             → Hono API server (port 3001)
apps/web             → Next.js frontend (port 3000)
apps/e2e             → Playwright E2E tests
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

## Key Decisions

- Zod schemas in `packages/db/src/zod.ts` are hand-written (not generated from Drizzle) due to Zod v4 incompatibility with `drizzle-zod`
- `isolatedDeclarations` is disabled in shared packages (tsdown generates dts)
- `.next` types excluded from tsc (Next.js validator.ts has stale ts-expect-error directives)
- shadcn/ui component lint rules relaxed in biome overrides
- AppType exported from `@argus/api/app-type` for Hono RPC client in frontend
