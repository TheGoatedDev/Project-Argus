import type { Database } from "@argus/db";
import { beforeAll, describe, expect, it } from "vitest";
import { createEntityService } from "../src/services/entity.service.js";
import { createTestApp } from "./helpers.js";

let db: Database;
let service: ReturnType<typeof createEntityService>;

beforeAll(async () => {
    const test = await createTestApp();
    db = test.db;
    service = createEntityService(db);
});

describe("entity service", () => {
    it("list() returns only non-deleted entities", async () => {
        const all = await service.list();
        expect(all.length).toBe(5); // 5 seeded entities
        // Create and soft-delete one
        const entity = await service.create({
            type: "person",
            name: "Temp Person",
        });
        await service.softDelete(entity!.id);
        const afterDelete = await service.list();
        expect(
            afterDelete.find((e) => e.name === "Temp Person"),
        ).toBeUndefined();
    });

    it("list(type) filters by entity type", async () => {
        const persons = await service.list("person");
        expect(persons.every((e) => e.type === "person")).toBe(true);
        expect(persons.length).toBeGreaterThanOrEqual(2); // John + Jane
    });

    it("getById() returns undefined for soft-deleted entity", async () => {
        const entity = await service.create({
            type: "domain",
            name: "deleted-test.com",
        });
        await service.softDelete(entity!.id);
        const result = await service.getById(entity!.id);
        expect(result).toBeUndefined();
    });

    it("create() returns entity with generated UUID and timestamps", async () => {
        const entity = await service.create({
            type: "ip",
            name: "192.168.1.1",
            metadata: { internal: true },
        });
        expect(entity).toBeDefined();
        expect(entity!.id).toMatch(/^[0-9a-f-]{36}$/);
        expect(entity!.createdAt).toBeDefined();
        expect(entity!.updatedAt).toBeDefined();
        expect(entity!.metadata).toEqual({ internal: true });
    });

    it("update() returns undefined for soft-deleted entity", async () => {
        const entity = await service.create({
            type: "phone",
            name: "+1234567890",
        });
        await service.softDelete(entity!.id);
        const result = await service.update(entity!.id, {
            name: "+0987654321",
        });
        expect(result).toBeUndefined();
    });

    it("softDelete() sets deletedAt", async () => {
        const entity = await service.create({
            type: "email",
            name: "del@test.com",
        });
        const deleted = await service.softDelete(entity!.id);
        expect(deleted).toBeDefined();
        expect(deleted!.deletedAt).toBeDefined();
        const result = await service.getById(entity!.id);
        expect(result).toBeUndefined();
    });

    it("softDelete() returns undefined for already-deleted entity", async () => {
        const entity = await service.create({
            type: "email",
            name: "del2@test.com",
        });
        await service.softDelete(entity!.id);
        const result = await service.softDelete(entity!.id);
        expect(result).toBeUndefined();
    });

    it("search() returns ranked results", async () => {
        // Seeded data has "John Doe" and "Jane Smith" as persons
        const result = await service.search({
            query: "John",
            limit: 10,
            offset: 0,
        });
        expect(result.results.length).toBeGreaterThanOrEqual(1);
        expect(result.results[0]!.name).toContain("John");
        expect(result.total).toBeGreaterThanOrEqual(1);
    });

    it("search() with type filter narrows results", async () => {
        const result = await service.search({
            query: "acme",
            type: "domain",
            limit: 10,
            offset: 0,
        });
        expect(result.results.every((e) => e.type === "domain")).toBe(true);
    });

    it("search() pagination works", async () => {
        // Create 5 entities with "searchtest" in the name
        for (let i = 0; i < 5; i++) {
            await service.create({
                type: "handle",
                name: `searchtest user ${i}`,
            });
        }
        const page1 = await service.search({
            query: "searchtest",
            limit: 2,
            offset: 0,
        });
        expect(page1.total).toBe(5);
        expect(page1.results.length).toBe(2);

        const page2 = await service.search({
            query: "searchtest",
            limit: 2,
            offset: 2,
        });
        expect(page2.results.length).toBe(2);
        // Different results
        expect(page2.results[0]!.id).not.toBe(page1.results[0]!.id);
    });

    it("search() returns empty for no-match query", async () => {
        const result = await service.search({
            query: "xyznonexistent999",
            limit: 10,
            offset: 0,
        });
        expect(result.results).toEqual([]);
        expect(result.total).toBe(0);
    });

    it("getEdges() returns edges where entity is source", async () => {
        // John Doe has outgoing edges: works_at Acme, owns email
        const persons = await service.list("person");
        const john = persons.find((e) => e.name === "John Doe");
        const edges = await service.getEdges(john!.id);
        expect(edges.length).toBeGreaterThanOrEqual(2);
    });

    it("getDataPoints() returns data points for entity", async () => {
        const persons = await service.list("person");
        const john = persons.find((e) => e.name === "John Doe");
        const dps = await service.getDataPoints(john!.id);
        expect(dps.length).toBeGreaterThanOrEqual(1);
        expect(dps[0]!.sourceProvider).toBe("manual");
    });
});
