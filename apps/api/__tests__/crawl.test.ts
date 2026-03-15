import type { Database } from "@argus/db";
import { createTestDb } from "@argus/db/test-utils";
import { ScraperRegistry } from "@argus/scraper-sdk";
import type { CrawlEvent, ExtractionResult, ScraperPlugin } from "@argus/types";
import type { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

function createMockScraper(
    name: string,
    extractFn: (query: string) => Promise<ExtractionResult>,
): ScraperPlugin {
    return {
        name,
        version: "1.0.0",
        sourceProvider: name,
        async *search() {},
        extract: extractFn,
        ping: async () => true,
    };
}

function parseSSEEvents(text: string): CrawlEvent[] {
    const events: CrawlEvent[] = [];
    for (const line of text.split("\n")) {
        if (line.startsWith("data:")) {
            try {
                events.push(JSON.parse(line.slice(5).trim()));
            } catch {}
        }
    }
    return events;
}

describe("Crawl API", () => {
    let app: Hono;
    let db: Database;

    beforeAll(async () => {
        const testDb = await createTestDb();
        db = testDb.db as unknown as Database;

        const registry = new ScraperRegistry();

        // DNS scraper: for domain queries, returns email entities
        registry.register(
            createMockScraper("dns", async (query) => ({
                entities: [
                    { type: "domain", name: query },
                    { type: "email", name: `admin@${query}` },
                ],
                edges: [
                    {
                        sourceRef: query,
                        targetRef: `admin@${query}`,
                        sourceType: "domain",
                        targetType: "email",
                        edgeType: "associated_with",
                        confidence: 1.0,
                    },
                ],
                dataPoints: [
                    {
                        entityRef: query,
                        entityType: "domain",
                        sourceProvider: "dns",
                        sourceUrl: `https://dns.example/${query}`,
                        rawData: { records: ["A", "MX"] },
                        fetchedAt: new Date(),
                    },
                ],
            })),
        );

        // Email scraper: for email queries, returns domain entities
        registry.register(
            createMockScraper("email", async (query) => {
                const domain = query.split("@")[1] ?? "unknown.com";
                return {
                    entities: [
                        { type: "email", name: query },
                        { type: "domain", name: domain },
                    ],
                    edges: [
                        {
                            sourceRef: query,
                            targetRef: domain,
                            sourceType: "email",
                            targetType: "domain",
                            edgeType: "associated_with",
                            confidence: 0.9,
                        },
                    ],
                    dataPoints: [
                        {
                            entityRef: query,
                            entityType: "email",
                            sourceProvider: "email",
                            sourceUrl: `https://email.example/${query}`,
                            rawData: { verified: true },
                            fetchedAt: new Date(),
                        },
                    ],
                };
            }),
        );

        app = createApp(db, registry);
    });

    describe("POST /api/crawl", () => {
        it("streams SSE events for a crawl", async () => {
            const res = await app.request("/api/crawl", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: "test.com",
                    entityType: "domain",
                    maxDepth: 1,
                }),
            });

            expect(res.status).toBe(200);
            const text = await res.text();
            const events = parseSSEEvents(text);

            expect(events.length).toBeGreaterThanOrEqual(3);

            const types = events.map((e) => e.type);
            expect(types).toContain("crawl:started");
            expect(types).toContain("crawl:depth");
            expect(types).toContain("crawl:completed");
        });

        it("expands BFS: domain → email at depth 1, email → domain at depth 2", async () => {
            const res = await app.request("/api/crawl", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: "bfs-test.com",
                    entityType: "domain",
                    maxDepth: 2,
                }),
            });

            expect(res.status).toBe(200);
            const text = await res.text();
            const events = parseSSEEvents(text) as CrawlEvent[];

            const depthEvents = events.filter((e) => e.type === "crawl:depth");
            expect(depthEvents.length).toBe(2);
            expect(depthEvents[0].depth).toBe(0);
            expect(depthEvents[1].depth).toBe(1);

            const scrapeEvents = events.filter(
                (e) => e.type === "crawl:scrape",
            );
            expect(scrapeEvents.length).toBeGreaterThanOrEqual(1);

            const completed = events.find((e) => e.type === "crawl:completed");
            expect(completed).toBeDefined();
            expect(completed.totalEntities).toBeGreaterThanOrEqual(2);
        });

        it("prevents cycles — does not re-scrape already visited entities", async () => {
            const res = await app.request("/api/crawl", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: "cycle-test.com",
                    entityType: "domain",
                    maxDepth: 3,
                }),
            });

            expect(res.status).toBe(200);
            const text = await res.text();
            const events = parseSSEEvents(text) as CrawlEvent[];

            // DNS returns admin@cycle-test.com, email scraper returns cycle-test.com again
            // cycle-test.com should NOT be scraped again at depth 2
            const scrapeEvents = events.filter(
                (e) => e.type === "crawl:scrape",
            );
            const domainScrapes = scrapeEvents.filter(
                (e) => e.entityName === "cycle-test.com",
            );
            expect(domainScrapes.length).toBe(1);
        });

        it("respects maxDepth=1 — only one level expanded", async () => {
            const res = await app.request("/api/crawl", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: "depth-limit.com",
                    entityType: "domain",
                    maxDepth: 1,
                }),
            });

            expect(res.status).toBe(200);
            const text = await res.text();
            const events = parseSSEEvents(text) as CrawlEvent[];

            const depthEvents = events.filter((e) => e.type === "crawl:depth");
            expect(depthEvents.length).toBe(1);
            expect(depthEvents[0].depth).toBe(0);
        });

        it("returns 400 for missing query", async () => {
            const res = await app.request("/api/crawl", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entityType: "domain", maxDepth: 2 }),
            });
            expect(res.status).toBe(400);
        });

        it("returns 400 for invalid entityType", async () => {
            const res = await app.request("/api/crawl", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: "test.com",
                    entityType: "invalid",
                    maxDepth: 2,
                }),
            });
            expect(res.status).toBe(400);
        });
    });

    describe("GET /api/crawl", () => {
        it("returns a list of crawl jobs", async () => {
            const res = await app.request("/api/crawl");
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(Array.isArray(body)).toBe(true);
            expect(body.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe("GET /api/crawl/:id", () => {
        it("returns 404 for non-existent job", async () => {
            const res = await app.request(
                "/api/crawl/00000000-0000-0000-0000-000000000000",
            );
            expect(res.status).toBe(404);
        });
    });
});
