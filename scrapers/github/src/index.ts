import { createScraper } from "@argus/scraper-sdk";
import type {
    ExtractedDataPoint,
    ExtractedEdge,
    ExtractedEntity,
    ExtractionResult,
    RawDataPoint,
    SearchOptions,
} from "@argus/types";

interface GitHubConfig {
    token?: string;
}

interface GitHubUser {
    login: string;
    name: string | null;
    email: string | null;
    company: string | null;
    bio: string | null;
    blog: string | null;
    location: string | null;
    public_repos: number;
    followers: number;
    following: number;
    html_url: string;
    type: string;
}

export function createGitHubScraper(config: GitHubConfig = {}) {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "argus-osint",
    };
    if (config.token) {
        headers.Authorization = `Bearer ${config.token}`;
    }

    async function fetchGitHub(path: string): Promise<unknown> {
        const res = await fetch(`https://api.github.com${path}`, { headers });
        if (!res.ok) return null;
        return res.json();
    }

    function extractFromUser(user: GitHubUser): ExtractionResult {
        const entities: ExtractedEntity[] = [];
        const edges: ExtractedEdge[] = [];
        const dataPoints: ExtractedDataPoint[] = [];
        const now = new Date();

        // Handle entity (always present)
        entities.push({
            type: "handle",
            name: `@${user.login}`,
            metadata: {
                platform: "github",
                url: user.html_url,
                followers: user.followers,
                publicRepos: user.public_repos,
            },
        });

        // Person entity (if display name exists)
        const personName = user.name ?? user.login;
        if (user.type === "User") {
            entities.push({
                type: "person",
                name: personName,
                metadata: {
                    bio: user.bio,
                    location: user.location,
                    blog: user.blog,
                },
            });
            edges.push({
                sourceRef: personName,
                targetRef: `@${user.login}`,
                sourceType: "person",
                targetType: "handle",
                edgeType: "owns",
                confidence: 1.0,
            });
        }

        // Email (if public)
        if (user.email) {
            entities.push({ type: "email", name: user.email });
            edges.push({
                sourceRef: personName,
                targetRef: user.email,
                sourceType: "person",
                targetType: "email",
                edgeType: "owns",
                confidence: 0.9,
            });
        }

        // Organization (from company field)
        if (user.company) {
            const orgName = user.company.replace(/^@/, "").trim();
            if (orgName) {
                entities.push({
                    type: "org",
                    name: orgName,
                    metadata: { source: "github_company_field" },
                });
                edges.push({
                    sourceRef: personName,
                    targetRef: orgName,
                    sourceType: "person",
                    targetType: "org",
                    edgeType: "works_at",
                    confidence: 0.6,
                });
            }
        }

        // Data point
        dataPoints.push({
            entityRef: `@${user.login}`,
            entityType: "handle",
            sourceProvider: "github",
            sourceUrl: user.html_url,
            rawData: user as unknown as Record<string, unknown>,
            fetchedAt: now,
        });

        return { entities, edges, dataPoints };
    }

    return createScraper({
        name: "github",
        version: "1.0.0",
        sourceProvider: "github",

        async *search(
            query: string,
            _options?: SearchOptions,
        ): AsyncGenerator<RawDataPoint> {
            const username = query.trim().replace(/^@/, "");
            const user = (await fetchGitHub(
                `/users/${username}`,
            )) as GitHubUser | null;
            if (!user) return;

            yield {
                sourceProvider: "github",
                sourceUrl: user.html_url,
                entityType: "handle",
                rawData: user as unknown as Record<string, unknown>,
                fetchedAt: new Date(),
            };
        },

        async extract(
            query: string,
            _options?: SearchOptions,
        ): Promise<ExtractionResult> {
            const username = query.trim().replace(/^@/, "");
            const user = (await fetchGitHub(
                `/users/${username}`,
            )) as GitHubUser | null;
            if (!user) {
                return { entities: [], edges: [], dataPoints: [] };
            }
            return extractFromUser(user);
        },

        async ping(): Promise<boolean> {
            try {
                const res = await fetch("https://api.github.com/zen", {
                    headers,
                });
                return res.ok;
            } catch {
                return false;
            }
        },
    });
}
