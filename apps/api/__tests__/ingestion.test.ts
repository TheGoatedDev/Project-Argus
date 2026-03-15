import type { Database } from "@argus/db";
import { entities } from "@argus/db";
import type { ExtractionResult } from "@argus/types";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createIngestionService } from "../src/services/ingestion.service.js";
import { createTestApp } from "./helpers.js";

let db: Database;

beforeAll(async () => {
    const test = await createTestApp();
    db = test.db;
});

describe("ingestion service", () => {
    it("upserts entities without duplicates", async () => {
        const service = createIngestionService(db);

        const result: ExtractionResult = {
            entities: [
                {
                    type: "domain",
                    name: "test-dedup.com",
                    metadata: { source: "first" },
                },
                { type: "ip", name: "1.2.3.4", metadata: { recordType: "A" } },
            ],
            edges: [
                {
                    sourceRef: "test-dedup.com",
                    targetRef: "1.2.3.4",
                    sourceType: "domain",
                    targetType: "ip",
                    edgeType: "associated_with",
                    confidence: 1.0,
                },
            ],
            dataPoints: [
                {
                    entityRef: "test-dedup.com",
                    entityType: "domain",
                    sourceProvider: "dns",
                    sourceUrl: "dns://test-dedup.com",
                    rawData: { test: true },
                    fetchedAt: new Date(),
                },
            ],
        };

        const first = await service.ingest(result);
        expect(first.entities.length).toBe(2);
        expect(first.edgeCount).toBe(1);
        expect(first.dataPointCount).toBe(1);

        // Ingest again — should upsert, not duplicate
        const second = await service.ingest({
            ...result,
            entities: [
                {
                    type: "domain",
                    name: "test-dedup.com",
                    metadata: { source: "second", extra: true },
                },
                { type: "ip", name: "1.2.3.4", metadata: { recordType: "A" } },
            ],
        });
        expect(second.entities.length).toBe(2);

        // Verify no duplicates in DB
        const domains = await db
            .select()
            .from(entities)
            .where(eq(entities.name, "test-dedup.com"));
        expect(domains.length).toBe(1);

        // Verify metadata was merged
        const domain = domains[0]!;
        expect((domain.metadata as Record<string, unknown>).extra).toBe(true);
    });

    it("resolves edge references correctly", async () => {
        const service = createIngestionService(db);

        const result: ExtractionResult = {
            entities: [
                { type: "person", name: "Edge Test Person" },
                { type: "org", name: "Edge Test Org" },
            ],
            edges: [
                {
                    sourceRef: "Edge Test Person",
                    targetRef: "Edge Test Org",
                    sourceType: "person",
                    targetType: "org",
                    edgeType: "works_at",
                    confidence: 0.8,
                },
            ],
            dataPoints: [],
        };

        const ingested = await service.ingest(result);
        expect(ingested.edgeCount).toBe(1);
        expect(ingested.entities.length).toBe(2);
    });

    it("skips edges with unresolved references", async () => {
        const service = createIngestionService(db);

        const result: ExtractionResult = {
            entities: [{ type: "domain", name: "orphan-edge-test.com" }],
            edges: [
                {
                    sourceRef: "orphan-edge-test.com",
                    targetRef: "nonexistent",
                    sourceType: "domain",
                    targetType: "ip",
                    edgeType: "associated_with",
                    confidence: 1.0,
                },
            ],
            dataPoints: [],
        };

        const ingested = await service.ingest(result);
        expect(ingested.edgeCount).toBe(0);
    });
});
