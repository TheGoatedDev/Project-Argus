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
});
