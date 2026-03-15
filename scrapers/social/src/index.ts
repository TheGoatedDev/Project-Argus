import { createScraper } from "@argus/scraper-sdk";
import type {
    ExtractedDataPoint,
    ExtractedEdge,
    ExtractedEntity,
    ExtractionResult,
    RawDataPoint,
    SearchOptions,
} from "@argus/types";

const PLATFORMS: { name: string; urlTemplate: string }[] = [
    { name: "github", urlTemplate: "https://github.com/{username}" },
    { name: "twitter", urlTemplate: "https://x.com/{username}" },
    { name: "instagram", urlTemplate: "https://www.instagram.com/{username}" },
    { name: "reddit", urlTemplate: "https://www.reddit.com/user/{username}" },
    { name: "linkedin", urlTemplate: "https://www.linkedin.com/in/{username}" },
    { name: "mastodon", urlTemplate: "https://mastodon.social/@{username}" },
    { name: "keybase", urlTemplate: "https://keybase.io/{username}" },
    {
        name: "hackernews",
        urlTemplate: "https://news.ycombinator.com/user?id={username}",
    },
    { name: "medium", urlTemplate: "https://medium.com/@{username}" },
    { name: "devto", urlTemplate: "https://dev.to/{username}" },
];

const CONCURRENCY = 5;

async function checkPlatform(url: string): Promise<boolean> {
    try {
        const res = await fetch(url, {
            method: "HEAD",
            redirect: "follow",
            signal: AbortSignal.timeout(5000),
        });
        return res.ok;
    } catch {
        return false;
    }
}

async function checkInChunks(
    items: { name: string; url: string }[],
    concurrency: number,
): Promise<{ name: string; url: string; exists: boolean }[]> {
    const results: { name: string; url: string; exists: boolean }[] = [];
    for (let i = 0; i < items.length; i += concurrency) {
        const chunk = items.slice(i, i + concurrency);
        const settled = await Promise.allSettled(
            chunk.map(async (item) => ({
                ...item,
                exists: await checkPlatform(item.url),
            })),
        );
        for (const r of settled) {
            if (r.status === "fulfilled") results.push(r.value);
            else
                results.push({
                    name: chunk[settled.indexOf(r)]!.name,
                    url: chunk[settled.indexOf(r)]!.url,
                    exists: false,
                });
        }
    }
    return results;
}

export function createSocialScraper() {
    return createScraper({
        name: "social",
        version: "1.0.0",
        sourceProvider: "social",

        async *search(
            query: string,
            _options?: SearchOptions,
        ): AsyncGenerator<RawDataPoint> {
            const username = query.trim().replace(/^@/, "");
            const items = PLATFORMS.map((p) => ({
                name: p.name,
                url: p.urlTemplate.replace("{username}", username),
            }));
            const results = await checkInChunks(items, CONCURRENCY);

            for (const result of results) {
                if (result.exists) {
                    yield {
                        sourceProvider: "social",
                        sourceUrl: result.url,
                        entityType: "handle",
                        rawData: {
                            platform: result.name,
                            username,
                            url: result.url,
                            exists: true,
                        },
                        fetchedAt: new Date(),
                    };
                }
            }
        },

        async extract(
            query: string,
            _options?: SearchOptions,
        ): Promise<ExtractionResult> {
            const username = query.trim().replace(/^@/, "");
            const items = PLATFORMS.map((p) => ({
                name: p.name,
                url: p.urlTemplate.replace("{username}", username),
            }));
            const results = await checkInChunks(items, CONCURRENCY);
            const found = results.filter((r) => r.exists);

            const entities: ExtractedEntity[] = [];
            const edges: ExtractedEdge[] = [];
            const dataPoints: ExtractedDataPoint[] = [];
            const now = new Date();

            for (const result of found) {
                entities.push({
                    type: "handle",
                    name: `${result.name}:${username}`,
                    metadata: { platform: result.name, url: result.url },
                });
                dataPoints.push({
                    entityRef: `${result.name}:${username}`,
                    entityType: "handle",
                    sourceProvider: "social",
                    sourceUrl: result.url,
                    rawData: { platform: result.name, username, exists: true },
                    fetchedAt: now,
                });
            }

            // Alias edges between all found handles (low confidence)
            for (let i = 0; i < found.length; i++) {
                for (let j = i + 1; j < found.length; j++) {
                    edges.push({
                        sourceRef: `${found[i]!.name}:${username}`,
                        targetRef: `${found[j]!.name}:${username}`,
                        sourceType: "handle",
                        targetType: "handle",
                        edgeType: "alias_of",
                        confidence: 0.5,
                    });
                }
            }

            return { entities, edges, dataPoints };
        },

        async ping(): Promise<boolean> {
            try {
                const res = await fetch("https://github.com", {
                    method: "HEAD",
                    signal: AbortSignal.timeout(5000),
                });
                return res.ok;
            } catch {
                return false;
            }
        },
    });
}
