import type { Database } from "@argus/db";
import { ScraperRegistry } from "@argus/scraper-sdk";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { db as defaultDb } from "./lib/db.js";
import { onError } from "./lib/errors.js";
import { createCrawlRoute } from "./routes/crawl.js";
import { createEntitiesRoute } from "./routes/entities.js";
import { createGraphRoute } from "./routes/graph.js";
import { healthRoute } from "./routes/health.js";
import { createInvestigationsRoute } from "./routes/investigations.js";
import { createScrapeRoute } from "./routes/scrape.js";
import { createSearchRoute } from "./routes/search.js";

export function createApp(db?: Database, registry?: ScraperRegistry) {
    const resolvedDb = db ?? defaultDb;

    const app = new Hono()
        .use("*", logger())
        .use("*", cors())
        .onError(onError)
        .route("/api", healthRoute)
        .route("/api/entities", createEntitiesRoute(resolvedDb))
        .route("/api/investigations", createInvestigationsRoute(resolvedDb))
        .route("/api/search", createSearchRoute(resolvedDb))
        .route("/api/graph", createGraphRoute(resolvedDb))
        .route(
            "/api/scrape",
            createScrapeRoute(resolvedDb, registry ?? new ScraperRegistry()),
        )
        .route(
            "/api/crawl",
            createCrawlRoute(resolvedDb, registry ?? new ScraperRegistry()),
        );

    return app;
}

const app = createApp();

export type AppType = typeof app;
