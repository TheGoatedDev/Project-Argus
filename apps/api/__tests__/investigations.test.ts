import {
    type Database,
    investigationEntities,
    investigations,
} from "@argus/db";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createTestApp } from "./helpers.js";

let app: ReturnType<typeof import("../src/app.js").createApp>;
let db: Database;

beforeAll(async () => {
    const test = await createTestApp();
    app = test.app;
    db = test.db;
});

describe("investigation routes", () => {
    // GET /api/investigations
    it("GET / returns list including seeded investigation", async () => {
        const res = await app.request("/api/investigations");
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.length).toBeGreaterThanOrEqual(1);
        expect(
            data.find((i: any) => i.name === "Sample Investigation"),
        ).toBeDefined();
    });

    // POST /api/investigations - success
    it("POST / creates investigation", async () => {
        const res = await app.request("/api/investigations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Test Investigation",
                description: "For testing",
            }),
        });
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.name).toBe("Test Investigation");
        expect(data.id).toBeDefined();
    });

    // POST /api/investigations - 400 for missing name
    it("POST / returns 400 for missing name", async () => {
        const res = await app.request("/api/investigations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: "no name" }),
        });
        expect(res.status).toBe(400);
    });

    // GET /api/investigations/:id - success (create one first, then get it)
    it("GET /:id returns created investigation", async () => {
        const createRes = await app.request("/api/investigations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Get By ID Test" }),
        });
        const created = await createRes.json();

        const res = await app.request(`/api/investigations/${created.id}`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.name).toBe("Get By ID Test");
    });

    // GET /:id - 404 for non-existent UUID
    it("GET /:id returns 404 for non-existent UUID", async () => {
        const res = await app.request(
            "/api/investigations/00000000-0000-0000-0000-000000000000",
        );
        expect(res.status).toBe(404);
    });

    // GET /:id - 400 for invalid UUID
    it("GET /:id returns 400 for invalid UUID", async () => {
        const res = await app.request("/api/investigations/not-a-uuid");
        expect(res.status).toBe(400);
    });

    // PATCH /:id - success
    it("PATCH /:id updates name and description", async () => {
        const createRes = await app.request("/api/investigations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Before Update" }),
        });
        const created = await createRes.json();

        const res = await app.request(`/api/investigations/${created.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "After Update",
                description: "Updated desc",
            }),
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.name).toBe("After Update");
        expect(data.description).toBe("Updated desc");
    });

    // PATCH /:id - 404
    it("PATCH /:id returns 404 for non-existent ID", async () => {
        const res = await app.request(
            "/api/investigations/00000000-0000-0000-0000-000000000000",
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "nope" }),
            },
        );
        expect(res.status).toBe(404);
    });

    // DELETE /:id - success
    it("DELETE /:id deletes and returns deleted record", async () => {
        const createRes = await app.request("/api/investigations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "To Delete" }),
        });
        const created = await createRes.json();

        const res = await app.request(`/api/investigations/${created.id}`, {
            method: "DELETE",
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.name).toBe("To Delete");

        // Verify it's actually gone
        const getRes = await app.request(`/api/investigations/${created.id}`);
        expect(getRes.status).toBe(404);
    });

    // DELETE /:id - 404
    it("DELETE /:id returns 404 for non-existent ID", async () => {
        const res = await app.request(
            "/api/investigations/00000000-0000-0000-0000-000000000000",
            {
                method: "DELETE",
            },
        );
        expect(res.status).toBe(404);
    });
});

// Entity association tests - need entity IDs from seeded data
describe("investigation entity associations", () => {
    let investigationId: string;
    let entityId: string;

    beforeAll(async () => {
        // Create a fresh investigation
        const invRes = await app.request("/api/investigations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Entity Assoc Test" }),
        });
        const inv = await invRes.json();
        investigationId = inv.id;

        // Get an entity from the seeded data (John Doe)
        const entRes = await app.request("/api/entities");
        const entities = await entRes.json();
        entityId = entities.find((e: any) => e.name === "John Doe")?.id;
    });

    it("POST /:id/entities adds entity to investigation", async () => {
        const res = await app.request(
            `/api/investigations/${investigationId}/entities`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entityId, notes: "Primary suspect" }),
            },
        );
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.entityId).toBe(entityId);
    });

    it("entity association exists after add", async () => {
        // Direct DB query to verify
        const rows = await db
            .select()
            .from(investigationEntities)
            .where(eq(investigationEntities.investigationId, investigationId));
        expect(rows.length).toBeGreaterThanOrEqual(1);
        expect(rows.find((r) => r.entityId === entityId)).toBeDefined();
    });

    it("DELETE /:id/entities/:entityId removes association", async () => {
        const res = await app.request(
            `/api/investigations/${investigationId}/entities/${entityId}`,
            { method: "DELETE" },
        );
        expect(res.status).toBe(200);
    });

    it("DELETE /:id/entities/:entityId returns 404 for non-existent mapping", async () => {
        const res = await app.request(
            `/api/investigations/${investigationId}/entities/00000000-0000-0000-0000-000000000000`,
            { method: "DELETE" },
        );
        expect(res.status).toBe(404);
    });

    it("cascade: delete investigation removes entity associations", async () => {
        // Create investigation, add entity, then delete investigation
        const invRes = await app.request("/api/investigations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Cascade Test" }),
        });
        const inv = await invRes.json();

        await app.request(`/api/investigations/${inv.id}/entities`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entityId }),
        });

        // Delete investigation
        await app.request(`/api/investigations/${inv.id}`, {
            method: "DELETE",
        });

        // Verify associations are gone
        const rows = await db
            .select()
            .from(investigationEntities)
            .where(eq(investigationEntities.investigationId, inv.id));
        expect(rows).toHaveLength(0);
    });
});
