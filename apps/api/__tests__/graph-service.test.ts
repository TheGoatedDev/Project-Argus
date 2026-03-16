import { type Database, entities, entityEdges } from "@argus/db";
import { createTestDb } from "@argus/db/test-utils";
import { beforeAll, describe, expect, it } from "vitest";
import { createGraphService } from "../src/services/graph.service.js";

let db: Database;
let service: ReturnType<typeof createGraphService>;

// Helper to create an entity and return its ID
async function createEntity(
    db: Database,
    name: string,
    type: "person" | "org" | "domain" = "person",
) {
    const [e] = await db.insert(entities).values({ type, name }).returning();
    return e!.id;
}

// Helper to create an edge
async function createEdge(
    db: Database,
    sourceId: string,
    targetId: string,
    edgeType:
        | "owns"
        | "works_at"
        | "associated_with"
        | "alias_of" = "associated_with",
    confidence = 1.0,
) {
    await db.insert(entityEdges).values({
        sourceId,
        targetId,
        edgeType,
        confidence,
        sourceProvider: "test",
    });
}

beforeAll(async () => {
    const { db: testDb } = await createTestDb();
    db = testDb as unknown as Database;
    service = createGraphService(db);
});

describe("graph service", () => {
    it("bidirectional traversal: finds source from target", async () => {
        const a = await createEntity(db, "Bidir A");
        const b = await createEntity(db, "Bidir B");
        await createEdge(db, a, b);

        const result = await service.traverse({
            entityId: b,
            depth: 1,
            minConfidence: 0,
        });
        expect(result.edges.length).toBe(1);
        const nodeIds = result.nodes.map((n: any) => n.id);
        expect(nodeIds).toContain(a);
        expect(nodeIds).toContain(b);
    });

    it("cycle prevention: A→B, B→C, C→A does not loop", async () => {
        const a = await createEntity(db, "Cycle A");
        const b = await createEntity(db, "Cycle B");
        const c = await createEntity(db, "Cycle C");
        await createEdge(db, a, b);
        await createEdge(db, b, c);
        await createEdge(db, c, a);

        const result = await service.traverse({
            entityId: a,
            depth: 5,
            minConfidence: 0,
        });
        expect(result.edges.length).toBe(3);
        // Each edge should appear exactly once
        const edgeIds = result.edges.map((e: any) => e.id);
        expect(new Set(edgeIds).size).toBe(3);
    });

    it("multi-hop depth limiting", async () => {
        const a = await createEntity(db, "Depth A");
        const b = await createEntity(db, "Depth B");
        const c = await createEntity(db, "Depth C");
        const d = await createEntity(db, "Depth D");
        await createEdge(db, a, b);
        await createEdge(db, b, c);
        await createEdge(db, c, d);

        // depth=1: only direct edges from A (A→B)
        const r1 = await service.traverse({
            entityId: a,
            depth: 1,
            minConfidence: 0,
        });
        expect(r1.edges.length).toBe(1);

        // depth=2: A→B and B→C
        const r2 = await service.traverse({
            entityId: a,
            depth: 2,
            minConfidence: 0,
        });
        expect(r2.edges.length).toBe(2);

        // depth=3: A→B, B→C, C→D
        const r3 = await service.traverse({
            entityId: a,
            depth: 3,
            minConfidence: 0,
        });
        expect(r3.edges.length).toBe(3);
    });

    it("edge type filtering", async () => {
        const a = await createEntity(db, "Filter A");
        const b = await createEntity(db, "Filter B");
        const c = await createEntity(db, "Filter C");
        await createEdge(db, a, b, "works_at");
        await createEdge(db, a, c, "owns");

        const result = await service.traverse({
            entityId: a,
            depth: 1,
            edgeTypes: ["works_at"],
            minConfidence: 0,
        });
        expect(result.edges.length).toBe(1);
        expect(result.edges[0].edge_type).toBe("works_at");
    });

    it("confidence filtering", async () => {
        const a = await createEntity(db, "Conf A");
        const b = await createEntity(db, "Conf B");
        const c = await createEntity(db, "Conf C");
        await createEdge(db, a, b, "associated_with", 0.5);
        await createEdge(db, a, c, "associated_with", 0.9);

        const result = await service.traverse({
            entityId: a,
            depth: 1,
            minConfidence: 0.8,
        });
        expect(result.edges.length).toBe(1);
        // Should only include the 0.9 confidence edge
        const nodeIds = result.nodes.map((n: any) => n.id);
        expect(nodeIds).toContain(c);
    });

    it("isolated entity returns empty graph", async () => {
        const a = await createEntity(db, "Isolated Entity");
        const result = await service.traverse({
            entityId: a,
            depth: 2,
            minConfidence: 0,
        });
        expect(result.nodes).toHaveLength(0);
        expect(result.edges).toHaveLength(0);
    });

    it("diamond pattern: D appears once via DISTINCT ON", async () => {
        const a = await createEntity(db, "Diamond A");
        const b = await createEntity(db, "Diamond B");
        const c = await createEntity(db, "Diamond C");
        const d = await createEntity(db, "Diamond D");
        await createEdge(db, a, b);
        await createEdge(db, a, c);
        await createEdge(db, b, d);
        await createEdge(db, c, d);

        const result = await service.traverse({
            entityId: a,
            depth: 2,
            minConfidence: 0,
        });
        // Should have 4 edges: A→B, A→C, B→D, C→D
        expect(result.edges.length).toBe(4);
        // D should appear once in nodes
        const nodeIds = result.nodes.map((n: any) => n.id);
        const dCount = nodeIds.filter((id: string) => id === d).length;
        expect(dCount).toBe(1);
    });
});
