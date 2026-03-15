import type { EntityType } from "./enums.js";

export interface RawDataPoint {
    sourceProvider: string;
    sourceUrl: string;
    entityType: EntityType;
    rawData: Record<string, unknown>;
    fetchedAt: Date;
}

export interface SearchOptions {
    limit?: number;
    offset?: number;
}

export interface MonitorOptions {
    interval?: number;
    maxResults?: number;
}

export interface ScraperPlugin {
    name: string;
    version: string;
    sourceProvider: string;

    /** One-off search by query string */
    search(
        query: string,
        options?: SearchOptions,
    ): AsyncGenerator<RawDataPoint>;

    /** Continuous monitoring of a target */
    monitor?(
        target: string,
        options?: MonitorOptions,
    ): AsyncGenerator<RawDataPoint>;

    /** Health check */
    ping(): Promise<boolean>;
}
