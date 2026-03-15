import { crawlJobEntities, crawlJobs, type Database } from "@argus/db";
import type { ScraperRegistry } from "@argus/scraper-sdk";
import type { CrawlEvent, EntityType } from "@argus/types";
import { eq } from "drizzle-orm";
import { getScrapersForEntityType } from "../lib/entity-scraper-map.js";
import { createIngestionService } from "./ingestion.service.js";

interface FrontierEntity {
    name: string;
    type: EntityType;
}

export function createCrawlService(db: Database, registry: ScraperRegistry) {
    const ingestion = createIngestionService(db);

    async function* crawl(
        query: string,
        entityType: EntityType,
        maxDepth: number,
    ): AsyncGenerator<CrawlEvent> {
        // Create crawl job
        const [job] = await db
            .insert(crawlJobs)
            .values({
                seedQuery: query,
                seedType: entityType,
                maxDepth,
                status: "running",
            })
            .returning();

        if (!job) throw new Error("Failed to create crawl job");

        const crawlJobId = job.id;
        const visited = new Set<string>();
        let frontier: FrontierEntity[] = [{ name: query, type: entityType }];
        let totalEntities = 0;
        let totalEdges = 0;
        let totalDataPoints = 0;
        let depthReached = 0;

        yield {
            type: "crawl:started",
            crawlJobId,
            seedQuery: query,
            maxDepth,
        };

        try {
            for (
                let depth = 0;
                depth < maxDepth && frontier.length > 0;
                depth++
            ) {
                depthReached = depth;

                yield {
                    type: "crawl:depth",
                    crawlJobId,
                    depth,
                    entitiesAtDepth: frontier.length,
                };

                const nextFrontier: FrontierEntity[] = [];

                // Process frontier entities with concurrency limit of 3
                const chunks: FrontierEntity[][] = [];
                for (let i = 0; i < frontier.length; i += 3) {
                    chunks.push(frontier.slice(i, i + 3));
                }

                for (const chunk of chunks) {
                    const results = await Promise.allSettled(
                        chunk.map(async (entity) => {
                            const key = `${entity.type}:${entity.name}`;
                            if (visited.has(key)) return null;
                            visited.add(key);

                            const scraperNames = getScrapersForEntityType(
                                entity.type,
                            );
                            if (scraperNames.length === 0) return null;

                            for (const scraperName of scraperNames) {
                                const scraper = registry.get(scraperName);
                                if (!scraper) continue;

                                try {
                                    const extractionResult =
                                        await scraper.extract(entity.name);
                                    const ingestionResult =
                                        await ingestion.ingest(
                                            extractionResult,
                                        );

                                    // Record in crawl_job_entities
                                    for (const e of ingestionResult.entities) {
                                        try {
                                            await db
                                                .insert(crawlJobEntities)
                                                .values({
                                                    crawlJobId,
                                                    entityId: e.id,
                                                    depth,
                                                    scraperUsed: scraperName,
                                                })
                                                .onConflictDoNothing();
                                        } catch {
                                            // ignore duplicates
                                        }
                                    }

                                    const newEntities =
                                        ingestionResult.entities.filter(
                                            (e) => e.created,
                                        );
                                    totalEntities +=
                                        ingestionResult.entities.length;
                                    totalEdges += ingestionResult.edgeCount;
                                    totalDataPoints +=
                                        ingestionResult.dataPointCount;

                                    // Add new unvisited entities to next frontier
                                    for (const e of newEntities) {
                                        const eKey = `${e.type}:${e.name}`;
                                        if (!visited.has(eKey)) {
                                            nextFrontier.push({
                                                name: e.name,
                                                type: e.type as EntityType,
                                            });
                                        }
                                    }

                                    return {
                                        type: "crawl:scrape" as const,
                                        crawlJobId,
                                        depth,
                                        entityName: entity.name,
                                        entityType: entity.type,
                                        scraperName,
                                        newEntities: newEntities.length,
                                        newEdges: ingestionResult.edgeCount,
                                    } satisfies CrawlEvent;
                                } catch (err) {
                                    return {
                                        type: "crawl:error" as const,
                                        crawlJobId,
                                        depth,
                                        entityName: entity.name,
                                        scraperName,
                                        error:
                                            err instanceof Error
                                                ? err.message
                                                : String(err),
                                    } satisfies CrawlEvent;
                                }
                            }

                            return null;
                        }),
                    );

                    for (const result of results) {
                        if (result.status === "fulfilled" && result.value) {
                            yield result.value;
                        }
                    }
                }

                // Update current depth
                await db
                    .update(crawlJobs)
                    .set({ currentDepth: depth + 1 })
                    .where(eq(crawlJobs.id, crawlJobId));

                frontier = nextFrontier;
            }

            // Mark completed
            await db
                .update(crawlJobs)
                .set({
                    status: "completed",
                    totalEntities,
                    totalEdges,
                    completedAt: new Date(),
                })
                .where(eq(crawlJobs.id, crawlJobId));

            yield {
                type: "crawl:completed",
                crawlJobId,
                totalEntities,
                totalEdges,
                totalDataPoints,
                depthReached: depthReached + 1,
            };
        } catch (err) {
            await db
                .update(crawlJobs)
                .set({
                    status: "failed",
                    error: err instanceof Error ? err.message : String(err),
                })
                .where(eq(crawlJobs.id, crawlJobId));
            throw err;
        }
    }

    return { crawl };
}
