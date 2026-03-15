import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGitHubScraper } from "../src/index.js";

const mockUser = {
    login: "octocat",
    name: "The Octocat",
    email: "octocat@github.com",
    company: "@github",
    bio: "GitHub mascot",
    blog: "https://github.blog",
    location: "San Francisco",
    public_repos: 8,
    followers: 10000,
    following: 9,
    html_url: "https://github.com/octocat",
    type: "User",
};

describe("createGitHubScraper", () => {
    beforeEach(() => {
        vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
            const urlStr = typeof url === "string" ? url : url.toString();
            if (urlStr.includes("/users/octocat")) {
                return new Response(JSON.stringify(mockUser), { status: 200 });
            }
            if (urlStr.includes("/zen")) {
                return new Response("Keep it logically awesome.", {
                    status: 200,
                });
            }
            return new Response("Not Found", { status: 404 });
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("extracts entities from a GitHub user", async () => {
        const scraper = createGitHubScraper();
        const result = await scraper.extract("octocat");

        const handle = result.entities.find(
            (e) => e.type === "handle" && e.name === "@octocat",
        );
        expect(handle).toBeDefined();

        const person = result.entities.find(
            (e) => e.type === "person" && e.name === "The Octocat",
        );
        expect(person).toBeDefined();

        const email = result.entities.find(
            (e) => e.type === "email" && e.name === "octocat@github.com",
        );
        expect(email).toBeDefined();

        const org = result.entities.find(
            (e) => e.type === "org" && e.name === "github",
        );
        expect(org).toBeDefined();

        // Check edges
        expect(result.edges.length).toBe(3); // owns handle, owns email, works_at org
    });

    it("returns empty result for non-existent user", async () => {
        const scraper = createGitHubScraper();
        const result = await scraper.extract("nonexistent-user-xyz");
        expect(result.entities).toEqual([]);
    });

    it("ping returns true when API is available", async () => {
        const scraper = createGitHubScraper();
        expect(await scraper.ping()).toBe(true);
    });
});
