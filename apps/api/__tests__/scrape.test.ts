import type { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vitest";
import { createTestApp } from "./helpers.js";

let app: Hono;

beforeAll(async () => {
    const test = await createTestApp();
    app = test.app;
});

describe("GET /api/scrape/scrapers", () => {
    it("returns list of scrapers", async () => {
        const res = await app.request("/api/scrape/scrapers");
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(Array.isArray(body)).toBe(true);
    });
});

describe("POST /api/scrape", () => {
    it("returns 404 for unknown scraper", async () => {
        const res = await app.request("/api/scrape", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: "test", scraperName: "nonexistent" }),
        });
        expect(res.status).toBe(404);
        const body = await res.json();
        expect(body.error).toBe("not_found");
    });

    it("returns 400 for missing query", async () => {
        const res = await app.request("/api/scrape", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scraperName: "dns" }),
        });
        expect(res.status).toBe(400);
    });

    it("returns 400 for missing scraperName", async () => {
        const res = await app.request("/api/scrape", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: "test" }),
        });
        expect(res.status).toBe(400);
    });
});
