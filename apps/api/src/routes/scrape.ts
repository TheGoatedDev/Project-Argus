import type { Database } from "@argus/db";
import type { ScraperRegistry } from "@argus/scraper-sdk";
import { Hono } from "hono";
import { scrapeBody, validate } from "../lib/schemas.js";
import { createIngestionService } from "../services/ingestion.service.js";

export function createScrapeRoute(db: Database, registry: ScraperRegistry) {
    const ingestion = createIngestionService(db);

    return new Hono()
        .get("/scrapers", (c) => {
            const scrapers = registry.list().map((s) => ({
                name: s.name,
                version: s.version,
                sourceProvider: s.sourceProvider,
            }));
            return c.json(scrapers);
        })
        .get("/scrapers/health", async (c) => {
            const health = await registry.pingAll();
            const result: Record<string, boolean> = {};
            for (const [name, ok] of health) {
                result[name] = ok;
            }
            return c.json(result);
        })
        .post("/", validate("json", scrapeBody), async (c) => {
            const { query, scraperName } = c.req.valid("json");
            const scraper = registry.get(scraperName);
            if (!scraper) {
                return c.json(
                    {
                        error: "not_found",
                        message: `Scraper "${scraperName}" not found`,
                    },
                    404,
                );
            }

            const extractionResult = await scraper.extract(query);
            const ingestionResult = await ingestion.ingest(extractionResult);

            return c.json({
                scraper: scraperName,
                query,
                entities: ingestionResult.entities,
                edgeCount: ingestionResult.edgeCount,
                dataPointCount: ingestionResult.dataPointCount,
            });
        });
}
