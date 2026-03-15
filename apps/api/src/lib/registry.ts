import { ScraperRegistry } from "@argus/scraper-sdk";

export async function createRegistry(): Promise<ScraperRegistry> {
    const registry = new ScraperRegistry();

    try {
        const { createDnsScraper } = await import("@argus/scraper-dns");
        registry.register(createDnsScraper());
    } catch {
        // DNS scraper package not available
    }

    try {
        const { createGitHubScraper } = await import("@argus/scraper-github");
        registry.register(
            createGitHubScraper({ token: process.env.GITHUB_TOKEN }),
        );
    } catch {
        // GitHub scraper package not available
    }

    try {
        const { createSocialScraper } = await import("@argus/scraper-social");
        registry.register(createSocialScraper());
    } catch {
        // Social scraper package not available
    }

    try {
        const { createEmailScraper } = await import("@argus/scraper-email");
        registry.register(
            createEmailScraper({ hibpApiKey: process.env.HIBP_API_KEY }),
        );
    } catch {
        // Email scraper package not available
    }

    return registry;
}
