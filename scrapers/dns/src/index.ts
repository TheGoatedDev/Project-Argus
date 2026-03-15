import dns from "node:dns/promises";
import { createScraper } from "@argus/scraper-sdk";
import type {
    ExtractionResult,
    RawDataPoint,
    SearchOptions,
} from "@argus/types";
import { extractFromDns } from "./extractor.js";

async function resolveSafe<T>(fn: () => Promise<T>): Promise<T | undefined> {
    try {
        return await fn();
    } catch {
        return undefined;
    }
}

/**
 * Extract the root domain from a potentially nested subdomain.
 * Uses SOA record lookups to find the authoritative zone, which correctly
 * handles multi-part TLDs (e.g., co.uk, com.au) without a hardcoded list.
 */
export async function getRootDomain(domain: string): Promise<string> {
    const parts = domain.split(".");
    // Walk up the domain tree from the full domain toward the TLD.
    // The first level that has a SOA record is the root domain.
    for (let i = 0; i < parts.length - 1; i++) {
        const candidate = parts.slice(i).join(".");
        try {
            await dns.resolveSoa(candidate);
            return candidate;
        } catch {
            // No SOA at this level, try one level up
        }
    }
    // Fallback: return the domain as-is
    return domain;
}

export function createDnsScraper() {
    return createScraper({
        name: "dns",
        version: "1.0.0",
        sourceProvider: "dns",

        async *search(
            query: string,
            _options?: SearchOptions,
        ): AsyncGenerator<RawDataPoint> {
            const input = query.trim().toLowerCase();
            const domain = await getRootDomain(input);
            const [a, aaaa, mx, ns, txt] = await Promise.all([
                resolveSafe(() => dns.resolve4(domain)),
                resolveSafe(() => dns.resolve6(domain)),
                resolveSafe(() => dns.resolveMx(domain)),
                resolveSafe(() => dns.resolveNs(domain)),
                resolveSafe(() => dns.resolveTxt(domain)),
            ]);

            let whoisData = null;
            try {
                const whoisJson = await import("whois-json");
                const whoisFn = whoisJson.default ?? whoisJson;
                whoisData = await whoisFn(domain);
            } catch {
                // WHOIS may fail for some TLDs
            }

            yield {
                sourceProvider: "dns",
                sourceUrl: `dns://${domain}`,
                entityType: "domain",
                rawData: { a, aaaa, mx, ns, txt, whois: whoisData },
                fetchedAt: new Date(),
            };
        },

        async extract(
            query: string,
            _options?: SearchOptions,
        ): Promise<ExtractionResult> {
            const input = query.trim().toLowerCase();
            const domain = await getRootDomain(input);
            const [a, aaaa, mx, ns, txt] = await Promise.all([
                resolveSafe(() => dns.resolve4(domain)),
                resolveSafe(() => dns.resolve6(domain)),
                resolveSafe(() => dns.resolveMx(domain)),
                resolveSafe(() => dns.resolveNs(domain)),
                resolveSafe(() => dns.resolveTxt(domain)),
            ]);

            let whoisData = null;
            try {
                const whoisJson = await import("whois-json");
                const whoisFn = whoisJson.default ?? whoisJson;
                whoisData = await whoisFn(domain);
            } catch {
                // WHOIS may fail for some TLDs
            }

            return extractFromDns(
                domain,
                { a, aaaa, mx, ns, txt },
                whoisData,
                input !== domain ? input : undefined,
            );
        },

        async ping(): Promise<boolean> {
            try {
                await dns.resolve4("google.com");
                return true;
            } catch {
                return false;
            }
        },
    });
}
