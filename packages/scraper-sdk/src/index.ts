import type { ScraperPlugin } from "@argus/types";

export type { ScraperPlugin } from "@argus/types";

export class BaseScraperError extends Error {
    constructor(
        message: string,
        public readonly scraperName: string,
    ) {
        super(`[${scraperName}] ${message}`);
        this.name = "BaseScraperError";
    }
}

export class ScraperRegistry {
    private scrapers = new Map<string, ScraperPlugin>();

    register(scraper: ScraperPlugin): void {
        this.scrapers.set(scraper.name, scraper);
    }

    get(name: string): ScraperPlugin | undefined {
        return this.scrapers.get(name);
    }

    list(): ScraperPlugin[] {
        return Array.from(this.scrapers.values());
    }

    async pingAll(): Promise<Map<string, boolean>> {
        const results = new Map<string, boolean>();
        for (const [name, scraper] of this.scrapers) {
            try {
                results.set(name, await scraper.ping());
            } catch {
                results.set(name, false);
            }
        }
        return results;
    }
}

export function createScraper(plugin: ScraperPlugin): ScraperPlugin {
    return plugin;
}
