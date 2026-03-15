import type { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vitest";
import { createTestApp } from "./helpers.js";

let app: Hono;
let seedPersonId: string;

beforeAll(async () => {
    const test = await createTestApp();
    app = test.app;

    // Grab the seeded person's ID before any mutations
    const res = await app.request("/api/entities?type=person");
    const list = await res.json();
    const john = list.find((e: { name: string }) => e.name === "John Doe");
    seedPersonId = john.id;
});

describe("POST /api/entities", () => {
    it("creates an entity with valid body", async () => {
        const res = await app.request("/api/entities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "person",
                name: "Test Person",
                metadata: { note: "testing" },
            }),
        });
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.name).toBe("Test Person");
        expect(body.type).toBe("person");
        expect(body.id).toBeDefined();
    });

    it("returns 400 for invalid body", async () => {
        const res = await app.request("/api/entities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "invalid_type", name: "" }),
        });
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toBe("validation_error");
        expect(body.issues).toBeDefined();
    });

    it("returns 400 when name is missing", async () => {
        const res = await app.request("/api/entities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "person" }),
        });
        expect(res.status).toBe(400);
    });
});

describe("GET /api/entities", () => {
    it("lists entities", async () => {
        const res = await app.request("/api/entities");
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
    });
});

describe("GET /api/entities/:id", () => {
    it("returns entity by id", async () => {
        const res = await app.request(`/api/entities/${seedPersonId}`);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.id).toBe(seedPersonId);
    });

    it("returns 404 for non-existent id", async () => {
        const res = await app.request(
            "/api/entities/00000000-0000-0000-0000-000000000000",
        );
        expect(res.status).toBe(404);
    });

    it("returns 400 for invalid uuid", async () => {
        const res = await app.request("/api/entities/not-a-uuid");
        expect(res.status).toBe(400);
    });
});

describe("PATCH /api/entities/:id", () => {
    it("updates an entity", async () => {
        // Create a dedicated entity for update test
        const createRes = await app.request("/api/entities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "handle", name: "to-update" }),
        });
        const created = await createRes.json();

        const res = await app.request(`/api/entities/${created.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Updated Name" }),
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.name).toBe("Updated Name");
    });
});

describe("DELETE /api/entities/:id", () => {
    it("soft-deletes an entity", async () => {
        const createRes = await app.request("/api/entities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "handle", name: "to-delete" }),
        });
        const created = await createRes.json();

        const res = await app.request(`/api/entities/${created.id}`, {
            method: "DELETE",
        });
        expect(res.status).toBe(200);

        const listRes = await app.request("/api/entities");
        const list = await listRes.json();
        expect(
            list.find((e: { id: string }) => e.id === created.id),
        ).toBeUndefined();
    });
});

describe("GET /api/entities/:id/edges", () => {
    it("returns edges for an entity", async () => {
        const res = await app.request(`/api/entities/${seedPersonId}/edges`);
        expect(res.status).toBe(200);
        const edges = await res.json();
        expect(Array.isArray(edges)).toBe(true);
        expect(edges.length).toBeGreaterThan(0);
    });
});

describe("GET /api/entities/:id/data-points", () => {
    it("returns data points for an entity", async () => {
        const res = await app.request(
            `/api/entities/${seedPersonId}/data-points`,
        );
        expect(res.status).toBe(200);
        const points = await res.json();
        expect(Array.isArray(points)).toBe(true);
    });
});
