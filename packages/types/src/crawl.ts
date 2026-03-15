import type { EntityType } from "./enums.js";

export type CrawlStatus = "pending" | "running" | "completed" | "failed";

export type CrawlEvent =
    | {
          type: "crawl:started";
          crawlJobId: string;
          seedQuery: string;
          maxDepth: number;
      }
    | {
          type: "crawl:depth";
          crawlJobId: string;
          depth: number;
          entitiesAtDepth: number;
      }
    | {
          type: "crawl:scrape";
          crawlJobId: string;
          depth: number;
          entityName: string;
          entityType: EntityType;
          scraperName: string;
          newEntities: number;
          newEdges: number;
      }
    | {
          type: "crawl:error";
          crawlJobId: string;
          depth: number;
          entityName: string;
          scraperName: string;
          error: string;
      }
    | {
          type: "crawl:completed";
          crawlJobId: string;
          totalEntities: number;
          totalEdges: number;
          totalDataPoints: number;
          depthReached: number;
      };

export interface CrawlRequest {
    query: string;
    entityType: EntityType;
    maxDepth: number;
}

export interface CrawlJobSummary {
    id: string;
    seedQuery: string;
    seedType: EntityType;
    maxDepth: number;
    currentDepth: number;
    status: CrawlStatus;
    totalEntities: number;
    totalEdges: number;
    error: string | null;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
}
