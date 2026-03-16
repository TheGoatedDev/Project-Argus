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

    it("extract() returns empty entities when no platforms match", async () => {
        vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
            return new Response(null, { status: 404 });
        });
        const scraper = createSocialScraper();
        const result = await scraper.extract("nonexistentuser999");
        expect(result.entities).toHaveLength(0);
        expect(result.edges).toHaveLength(0);
    });

    it("extract() creates correct alias edge count for 3 matches", async () => {
        vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
            const urlStr = typeof url === "string" ? url : url.toString();
            if (
                urlStr.includes("github.com/triuser") ||
                urlStr.includes("dev.to/triuser") ||
                urlStr.includes("medium.com/@triuser")
            ) {
                return new Response(null, { status: 200 });
            }
            return new Response(null, { status: 404 });
        });
        const scraper = createSocialScraper();
        const result = await scraper.extract("triuser");
        expect(result.entities).toHaveLength(3);
        // n*(n-1)/2 = 3*2/2 = 3 alias edges
        expect(result.edges).toHaveLength(3);
        expect(result.edges.every((e) => e.edgeType === "alias_of")).toBe(true);
    });
});
