import { eq, isNull, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
    dataPoints,
    entities,
    entityEdges,
    investigationEntities,
    investigations,
} from "../src/schema.js";
import { createTestDb } from "../src/test-utils.js";

describe("database schema", () => {
    it("should insert and query an entity", async () => {
        const { db } = await createTestDb();

        const [inserted] = await db
            .insert(entities)
            .values({
                type: "person",
                name: "Jane Doe",
                metadata: { email: "jane@example.com" },
            })
            .returning();

        expect(inserted).toBeDefined();
        expect(inserted?.name).toBe("Jane Doe");
        expect(inserted?.type).toBe("person");

        const [queried] = await db
            .select()
            .from(entities)
            .where(eq(entities.id, inserted?.id));

        expect(queried).toBeDefined();
        expect(queried?.name).toBe("Jane Doe");
        expect(queried?.metadata).toEqual({ email: "jane@example.com" });
        expect(queried?.deletedAt).toBeNull();
    });
});

describe("soft-delete filtering", () => {
    it("excludes soft-deleted entities via WHERE deleted_at IS NULL", async () => {
        const { db } = await createTestDb();

        const [inserted] = await db
            .insert(entities)
            .values({ type: "person", name: "Ghost User" })
            .returning();

        await db
            .update(entities)
            .set({ deletedAt: new Date() })
            .where(eq(entities.id, inserted!.id));

        const active = await db
            .select()
            .from(entities)
            .where(isNull(entities.deletedAt));

        expect(active.find((e) => e.id === inserted!.id)).toBeUndefined();
    });
});

describe("partial unique index", () => {
    it("rejects two active entities with the same (type, name)", async () => {
        const { db } = await createTestDb();

        await db
            .insert(entities)
            .values({ type: "org", name: "Acme Corp" })
            .returning();

        await expect(
            db.insert(entities).values({ type: "org", name: "Acme Corp" }),
        ).rejects.toThrow();
    });

    it("allows re-inserting (type, name) after soft-deleting the original", async () => {
        const { db } = await createTestDb();

        const [first] = await db
            .insert(entities)
            .values({ type: "org", name: "Deleted Corp" })
            .returning();

        await db
            .update(entities)
            .set({ deletedAt: new Date() })
            .where(eq(entities.id, first!.id));

        const [second] = await db
            .insert(entities)
            .values({ type: "org", name: "Deleted Corp" })
            .returning();

        expect(second).toBeDefined();
        expect(second?.deletedAt).toBeNull();
    });
});

describe("tsvector trigger", () => {
    it("populates search_vector on insert", async () => {
        const { db, client } = await createTestDb();

        const [inserted] = await db
            .insert(entities)
            .values({ type: "person", name: "Alan Turing" })
            .returning();

        const result = await client.query(
            `SELECT search_vector FROM entities WHERE id = $1`,
            [inserted!.id],
        );

        const vector: string = result.rows[0].search_vector;
        expect(vector).toBeTruthy();
        expect(vector).toMatch(/alan/i);
    });

    it("matches plainto_tsquery against the populated search_vector", async () => {
        const { db, client } = await createTestDb();

        const [inserted] = await db
            .insert(entities)
            .values({ type: "person", name: "Grace Hopper" })
            .returning();

        const result = await client.query(
            `SELECT search_vector @@ plainto_tsquery('english', 'hopper') AS matched
             FROM entities WHERE id = $1`,
            [inserted!.id],
        );

        expect(result.rows[0].matched).toBe(true);
    });
});

describe("full-text search ranking", () => {
    it("ranks name match (weight A) above metadata match (weight B)", async () => {
        const { db, client } = await createTestDb();

        const [nameMatch] = await db
            .insert(entities)
            .values({
                type: "person",
                name: "quantum physics expert",
                metadata: {},
            })
            .returning();

        const [metaMatch] = await db
            .insert(entities)
            .values({
                type: "person",
                name: "unknown",
                metadata: { field: "quantum physics researcher" },
            })
            .returning();

        const result = await client.query(
            `SELECT id, ts_rank_cd(search_vector, plainto_tsquery('english', 'quantum physics')) AS rank
             FROM entities
             WHERE id = ANY($1::uuid[])
             ORDER BY rank DESC`,
            [[nameMatch!.id, metaMatch!.id]],
        );

        expect(result.rows[0].id).toBe(nameMatch!.id);
        expect(result.rows[1].id).toBe(metaMatch!.id);
    });
});

describe("JSONB metadata", () => {
    it("replaces metadata entirely on update with set()", async () => {
        const { db } = await createTestDb();

        const [inserted] = await db
            .insert(entities)
            .values({
                type: "domain",
                name: "example.com",
                metadata: { original: true },
            })
            .returning();

        await db
            .update(entities)
            .set({ metadata: { replaced: true } })
            .where(eq(entities.id, inserted!.id));

        const [updated] = await db
            .select()
            .from(entities)
            .where(eq(entities.id, inserted!.id));

        expect(updated?.metadata).toEqual({ replaced: true });
        expect(
            (updated?.metadata as Record<string, unknown>).original,
        ).toBeUndefined();
    });
});

describe("cascade deletes", () => {
    it("removes investigation_entities rows when the investigation is deleted", async () => {
        const { db } = await createTestDb();

        const [entity] = await db
            .insert(entities)
            .values({ type: "person", name: "Cascade Person" })
            .returning();

        const [inv] = await db
            .insert(investigations)
            .values({ name: "Test Investigation" })
            .returning();

        await db.insert(investigationEntities).values({
            investigationId: inv!.id,
            entityId: entity!.id,
        });

        await db.delete(investigations).where(eq(investigations.id, inv!.id));

        const links = await db
            .select()
            .from(investigationEntities)
            .where(eq(investigationEntities.investigationId, inv!.id));

        expect(links).toHaveLength(0);
    });
});

describe("edge unique constraint", () => {
    it("rejects duplicate (source, target, edge_type) edges", async () => {
        const { db } = await createTestDb();

        const [source] = await db
            .insert(entities)
            .values({ type: "person", name: "Source Node" })
            .returning();

        const [target] = await db
            .insert(entities)
            .values({ type: "org", name: "Target Node" })
            .returning();

        await db.insert(entityEdges).values({
            sourceId: source!.id,
            targetId: target!.id,
            edgeType: "owns",
        });

        await expect(
            db.insert(entityEdges).values({
                sourceId: source!.id,
                targetId: target!.id,
                edgeType: "owns",
            }),
        ).rejects.toThrow();
    });

    it("allows same (source, target) with a different edge_type", async () => {
        const { db } = await createTestDb();

        const [source] = await db
            .insert(entities)
            .values({ type: "person", name: "Multi-Edge Source" })
            .returning();

        const [target] = await db
            .insert(entities)
            .values({ type: "org", name: "Multi-Edge Target" })
            .returning();

        await db.insert(entityEdges).values({
            sourceId: source!.id,
            targetId: target!.id,
            edgeType: "owns",
        });

        const [second] = await db
            .insert(entityEdges)
            .values({
                sourceId: source!.id,
                targetId: target!.id,
                edgeType: "works_at",
            })
            .returning();

        expect(second).toBeDefined();
        expect(second?.edgeType).toBe("works_at");
    });
});
