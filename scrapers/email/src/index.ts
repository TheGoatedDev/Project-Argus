import dns from "node:dns/promises";
import { createScraper } from "@argus/scraper-sdk";
import type {
    ExtractedDataPoint,
    ExtractedEdge,
    ExtractedEntity,
    ExtractionResult,
    RawDataPoint,
    SearchOptions,
} from "@argus/types";

interface EmailConfig {
    hibpApiKey?: string;
}

interface HibpBreach {
    Name: string;
    Title: string;
    Domain: string;
    BreachDate: string;
    DataClasses: string[];
}

export function createEmailScraper(config: EmailConfig = {}) {
    async function resolveMx(domain: string) {
        try {
            return await dns.resolveMx(domain);
        } catch {
            return [];
        }
    }

    async function fetchBreaches(email: string): Promise<HibpBreach[]> {
        if (!config.hibpApiKey) return [];
        try {
            const res = await fetch(
                `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
                {
                    headers: {
                        "hibp-api-key": config.hibpApiKey,
                        "User-Agent": "argus-osint",
                    },
                },
            );
            if (!res.ok) return [];
            return (await res.json()) as HibpBreach[];
        } catch {
            return [];
        }
    }

    return createScraper({
        name: "email",
        version: "1.0.0",
        sourceProvider: "email",

        async *search(
            query: string,
            _options?: SearchOptions,
        ): AsyncGenerator<RawDataPoint> {
            const email = query.trim().toLowerCase();
            const domain = email.split("@")[1];
            if (!domain) return;

            const mx = await resolveMx(domain);
            const breaches = await fetchBreaches(email);

            yield {
                sourceProvider: "email",
                sourceUrl: `mailto:${email}`,
                entityType: "email",
                rawData: { email, domain, mx, breaches },
                fetchedAt: new Date(),
            };
        },

        async extract(
            query: string,
            _options?: SearchOptions,
        ): Promise<ExtractionResult> {
            const email = query.trim().toLowerCase();
            const domain = email.split("@")[1];
            if (!domain) {
                return { entities: [], edges: [], dataPoints: [] };
            }

            const mx = await resolveMx(domain);
            const breaches = await fetchBreaches(email);
            const now = new Date();

            const entities: ExtractedEntity[] = [];
            const edges: ExtractedEdge[] = [];
            const dataPoints: ExtractedDataPoint[] = [];

            // Email entity
            entities.push({
                type: "email",
                name: email,
                metadata: { hasMx: mx.length > 0 },
            });

            // Domain entity
            entities.push({
                type: "domain",
                name: domain,
                metadata: {
                    mxRecords: mx.map(
                        (r: { exchange: string; priority: number }) => ({
                            exchange: r.exchange,
                            priority: r.priority,
                        }),
                    ),
                },
            });

            // Email -> Domain edge
            edges.push({
                sourceRef: email,
                targetRef: domain,
                sourceType: "email",
                targetType: "domain",
                edgeType: "associated_with",
                confidence: 1.0,
            });

            // Breach orgs
            for (const breach of breaches) {
                entities.push({
                    type: "org",
                    name: breach.Name,
                    metadata: {
                        breachDate: breach.BreachDate,
                        breachDomain: breach.Domain,
                        dataClasses: breach.DataClasses,
                    },
                });
                edges.push({
                    sourceRef: email,
                    targetRef: breach.Name,
                    sourceType: "email",
                    targetType: "org",
                    edgeType: "associated_with",
                    confidence: 1.0,
                });
            }

            // Data point
            dataPoints.push({
                entityRef: email,
                entityType: "email",
                sourceProvider: "email",
                sourceUrl: `mailto:${email}`,
                rawData: { email, domain, mx, breaches },
                fetchedAt: now,
            });

            return { entities, edges, dataPoints };
        },

        async ping(): Promise<boolean> {
            try {
                await dns.resolveMx("gmail.com");
                return true;
            } catch {
                return false;
            }
        },
    });
}
