import type { EdgeType, EntityType } from "./enums.js";

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

export interface ExtractedEntity {
    type: EntityType;
    name: string;
    metadata?: Record<string, unknown>;
}

export interface ExtractedEdge {
    sourceRef: string;
    targetRef: string;
    sourceType: EntityType;
    targetType: EntityType;
    edgeType: EdgeType;
    confidence: number;
}

export interface ExtractedDataPoint {
    entityRef: string;
    entityType: EntityType;
    sourceProvider: string;
    sourceUrl: string;
    rawData: Record<string, unknown>;
    fetchedAt: Date;
}

export interface ExtractionResult {
    entities: ExtractedEntity[];
    edges: ExtractedEdge[];
    dataPoints: ExtractedDataPoint[];
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

    /** Structured extraction — returns entities, edges, and data points */
    extract(query: string, options?: SearchOptions): Promise<ExtractionResult>;

    /** Continuous monitoring of a target */
    monitor?(
        target: string,
        options?: MonitorOptions,
    ): AsyncGenerator<RawDataPoint>;

    /** Health check */
    ping(): Promise<boolean>;
}
