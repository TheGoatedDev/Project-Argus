import type { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vitest";
import { createTestApp } from "./helpers.js";

let app: Hono;

beforeAll(async () => {
    const test = await createTestApp();
    app = test.app;
});

async function getEntityByName(name: string) {
    const res = await app.request("/api/entities");
    const list = await res.json();
    return list.find((e: { name: string }) => e.name === name);
}

describe("GET /api/graph/:entityId", () => {
    it("returns direct connections at depth=1", async () => {
        const john = await getEntityByName("John Doe");
        const res = await app.request(`/api/graph/${john.id}?depth=1`);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.edges.length).toBeGreaterThan(0);
        expect(body.nodes.length).toBeGreaterThan(0);
    });

    it("returns 2-hop connections at depth=2", async () => {
        const john = await getEntityByName("John Doe");

        const depth1Res = await app.request(`/api/graph/${john.id}?depth=1`);
        const depth1 = await depth1Res.json();

        const depth2Res = await app.request(`/api/graph/${john.id}?depth=2`);
        const depth2 = await depth2Res.json();

        // Depth 2 should have at least as many edges as depth 1
        expect(depth2.edges.length).toBeGreaterThanOrEqual(depth1.edges.length);
    });

    it("filters by edge type", async () => {
        const john = await getEntityByName("John Doe");
        const res = await app.request(
            `/api/graph/${john.id}?depth=2&edgeTypes=works_at`,
        );
        expect(res.status).toBe(200);
        const body = await res.json();
        for (const edge of body.edges) {
            expect(edge.edge_type).toBe("works_at");
        }
    });

    it("filters by confidence threshold", async () => {
        const john = await getEntityByName("John Doe");
        const res = await app.request(
            `/api/graph/${john.id}?depth=2&minConfidence=0.99`,
        );
        expect(res.status).toBe(200);
        const body = await res.json();
        for (const edge of body.edges) {
            expect(edge.confidence).toBeGreaterThanOrEqual(0.99);
        }
    });

    it("returns empty graph for isolated entity", async () => {
        // Create an isolated entity
        const createRes = await app.request("/api/entities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "ip", name: "192.168.1.1" }),
        });
        const isolated = await createRes.json();

        const res = await app.request(`/api/graph/${isolated.id}?depth=2`);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.edges).toHaveLength(0);
        expect(body.nodes).toHaveLength(0);
    });

    it("returns 400 for invalid entityId", async () => {
        const res = await app.request("/api/graph/not-a-uuid?depth=1");
        expect(res.status).toBe(400);
    });
});
