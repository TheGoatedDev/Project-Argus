import { crawlJobs, type Database } from "@argus/db";
import type { ScraperRegistry } from "@argus/scraper-sdk";
import { EntityTypeSchema } from "@argus/types";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import { idParam, validate } from "../lib/schemas.js";
import { createCrawlService } from "../services/crawl.service.js";

const crawlBody = z.object({
    query: z.string().min(1),
    entityType: EntityTypeSchema,
    maxDepth: z.coerce.number().int().min(1).max(5).default(2),
});

const listQuery = z.object({
    limit: z.coerce.number().int().min(1).max(50).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});

export function createCrawlRoute(db: Database, registry: ScraperRegistry) {
    const crawlService = createCrawlService(db, registry);

    return new Hono()
        .post("/", validate("json", crawlBody), async (c) => {
            const { query, entityType, maxDepth } = c.req.valid("json");

            return streamSSE(c, async (stream) => {
                try {
                    for await (const event of crawlService.crawl(
                        query,
                        entityType,
                        maxDepth,
                    )) {
                        await stream.writeSSE({
                            event: event.type,
                            data: JSON.stringify(event),
                        });
                    }
                } catch (err) {
                    await stream.writeSSE({
                        event: "crawl:error",
                        data: JSON.stringify({
                            type: "crawl:error",
                            error:
                                err instanceof Error
                                    ? err.message
                                    : String(err),
                        }),
                    });
                }
            });
        })
        .get("/", validate("query", listQuery), async (c) => {
            const { limit, offset } = c.req.valid("query");
            const jobs = await db
                .select()
                .from(crawlJobs)
                .orderBy(desc(crawlJobs.createdAt))
                .limit(limit)
                .offset(offset);
            return c.json(jobs);
        })
        .get("/:id", validate("param", idParam), async (c) => {
            const { id } = c.req.valid("param");
            const [job] = await db
                .select()
                .from(crawlJobs)
                .where(eq(crawlJobs.id, id));
            if (!job) {
                return c.json(
                    { error: "not_found", message: "Crawl job not found" },
                    404,
                );
            }
            return c.json(job);
        });
}
