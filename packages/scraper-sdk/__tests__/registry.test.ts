import type { ScraperPlugin } from "@argus/types";
import { describe, expect, it } from "vitest";
import { createScraper, ScraperRegistry } from "../src/index.js";

function createMockScraper(name: string): ScraperPlugin {
    return createScraper({
        name,
        version: "1.0.0",
        sourceProvider: name,
        async *search() {
            // no-op
        },
        async ping() {
            return true;
        },
    });
}

describe("ScraperRegistry", () => {
    it("should register and retrieve a scraper", () => {
        const registry = new ScraperRegistry();
        const scraper = createMockScraper("test-scraper");

        registry.register(scraper);

        expect(registry.get("test-scraper")).toBe(scraper);
    });

    it("should list all registered scrapers", () => {
        const registry = new ScraperRegistry();
        registry.register(createMockScraper("scraper-a"));
        registry.register(createMockScraper("scraper-b"));

        const list = registry.list();
        expect(list).toHaveLength(2);
        expect(list.map((s) => s.name)).toEqual(["scraper-a", "scraper-b"]);
    });

    it("should ping all scrapers", async () => {
        const registry = new ScraperRegistry();
        registry.register(createMockScraper("healthy"));

        const results = await registry.pingAll();
        expect(results.get("healthy")).toBe(true);
    });

    it("get() returns undefined for unregistered scraper", () => {
        const registry = new ScraperRegistry();
        expect(registry.get("nonexistent")).toBeUndefined();
    });

    it("duplicate registration overwrites previous scraper", () => {
        const registry = new ScraperRegistry();
        const first = createMockScraper("dup");
        const second = createMockScraper("dup");
        registry.register(first);
        registry.register(second);
        expect(registry.get("dup")).toBe(second);
        expect(registry.list()).toHaveLength(1);
    });

    it("pingAll() reports false for scraper whose ping() throws", async () => {
        const registry = new ScraperRegistry();
        const failing: ScraperPlugin = {
            name: "failing",
            version: "1.0.0",
            sourceProvider: "failing",
            async *search() {},
            async extract() {
                return { entities: [], edges: [], dataPoints: [] };
            },
            async ping() {
                throw new Error("down");
            },
        };
        registry.register(failing);
        const results = await registry.pingAll();
        expect(results.get("failing")).toBe(false);
    });

    it("list() on empty registry returns empty array", () => {
        const registry = new ScraperRegistry();
        expect(registry.list()).toEqual([]);
    });
});
