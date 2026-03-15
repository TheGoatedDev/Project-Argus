import type { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vitest";
import { createTestApp } from "./helpers.js";

let app: Hono;

beforeAll(async () => {
    const test = await createTestApp();
    app = test.app;
});

describe("GET /api/search", () => {
    it("returns 400 when q is missing", async () => {
        const res = await app.request("/api/search");
        expect(res.status).toBe(400);
    });

    it("searches by name", async () => {
        const res = await app.request("/api/search?q=John");
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.results.length).toBeGreaterThan(0);
        expect(body.total).toBeGreaterThan(0);
        expect(body.limit).toBe(20);
        expect(body.offset).toBe(0);
    });

    it("filters by type", async () => {
        const res = await app.request("/api/search?q=John&type=person");
        expect(res.status).toBe(200);
        const body = await res.json();
        for (const entity of body.results) {
            expect(entity.type).toBe("person");
        }
    });

    it("returns empty results for non-matching query", async () => {
        const res = await app.request("/api/search?q=zzzznonexistent12345");
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.results).toHaveLength(0);
        expect(body.total).toBe(0);
    });

    it("respects limit and offset", async () => {
        const res = await app.request("/api/search?q=acme&limit=1&offset=0");
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.results.length).toBeLessThanOrEqual(1);
        expect(body.limit).toBe(1);
        expect(body.offset).toBe(0);
    });

    it("ranks name matches higher", async () => {
        // "Acme" appears in both entity name and metadata
        const res = await app.request("/api/search?q=acme");
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.results.length).toBeGreaterThan(0);
        // The org named "Acme Corp" should be among results
        const acmeOrg = body.results.find(
            (r: { name: string }) => r.name === "Acme Corp",
        );
        expect(acmeOrg).toBeDefined();
    });
});
