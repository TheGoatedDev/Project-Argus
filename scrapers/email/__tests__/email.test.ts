import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dns before importing the module
vi.mock("node:dns/promises", () => ({
    default: {
        resolveMx: vi.fn(),
    },
}));

import dns from "node:dns/promises";
import { createEmailScraper } from "../src/index.js";

const mockMx = [
    { exchange: "mx1.gmail.com", priority: 10 },
    { exchange: "mx2.gmail.com", priority: 20 },
];

describe("createEmailScraper", () => {
    beforeEach(() => {
        vi.mocked(dns.resolveMx).mockResolvedValue(mockMx);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("extracts email and domain entities", async () => {
        const scraper = createEmailScraper();
        const result = await scraper.extract("user@gmail.com");

        const emailEntity = result.entities.find(
            (e) => e.type === "email" && e.name === "user@gmail.com",
        );
        expect(emailEntity).toBeDefined();
        expect(emailEntity!.metadata?.hasMx).toBe(true);

        const domainEntity = result.entities.find(
            (e) => e.type === "domain" && e.name === "gmail.com",
        );
        expect(domainEntity).toBeDefined();

        const emailDomainEdge = result.edges.find(
            (e) =>
                e.sourceRef === "user@gmail.com" && e.targetRef === "gmail.com",
        );
        expect(emailDomainEdge).toBeDefined();
        expect(emailDomainEdge!.edgeType).toBe("associated_with");
    });

    it("returns empty for invalid email (no @)", async () => {
        const scraper = createEmailScraper();
        const result = await scraper.extract("notanemail");
        expect(result.entities).toEqual([]);
    });

    it("includes breaches when API key is provided", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(
                JSON.stringify([
                    {
                        Name: "ExampleBreach",
                        Title: "Example Breach",
                        Domain: "example.com",
                        BreachDate: "2020-01-01",
                        DataClasses: ["Emails", "Passwords"],
                    },
                ]),
                { status: 200 },
            ),
        );

        const scraper = createEmailScraper({ hibpApiKey: "test-key" });
        const result = await scraper.extract("user@gmail.com");

        const breachOrg = result.entities.find(
            (e) => e.type === "org" && e.name === "ExampleBreach",
        );
        expect(breachOrg).toBeDefined();

        const breachEdge = result.edges.find(
            (e) =>
                e.sourceRef === "user@gmail.com" &&
                e.targetRef === "ExampleBreach",
        );
        expect(breachEdge).toBeDefined();
    });

    it("ping returns true when DNS works", async () => {
        const scraper = createEmailScraper();
        expect(await scraper.ping()).toBe(true);
    });
});
