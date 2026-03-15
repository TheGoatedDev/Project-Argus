import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSocialScraper } from "../src/index.js";

describe("createSocialScraper", () => {
    beforeEach(() => {
        vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
            const urlStr = typeof url === "string" ? url : url.toString();
            if (urlStr.includes("github.com/testuser")) {
                return new Response(null, { status: 200 });
            }
            if (urlStr.includes("dev.to/testuser")) {
                return new Response(null, { status: 200 });
            }
            // Ping check
            if (urlStr === "https://github.com") {
                return new Response(null, { status: 200 });
            }
            return new Response(null, { status: 404 });
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("finds handles on platforms where username exists", async () => {
        const scraper = createSocialScraper();
        const result = await scraper.extract("testuser");

        expect(result.entities.length).toBe(2);
        expect(
            result.entities.find((e) => e.name === "github:testuser"),
        ).toBeDefined();
        expect(
            result.entities.find((e) => e.name === "devto:testuser"),
        ).toBeDefined();
    });

    it("creates alias edges between found handles", async () => {
        const scraper = createSocialScraper();
        const result = await scraper.extract("testuser");

        expect(result.edges.length).toBe(1);
        expect(result.edges[0]!.edgeType).toBe("alias_of");
        expect(result.edges[0]!.confidence).toBe(0.5);
    });

    it("ping returns true", async () => {
        const scraper = createSocialScraper();
        expect(await scraper.ping()).toBe(true);
    });
});
