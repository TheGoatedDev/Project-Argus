import { sql } from "drizzle-orm";
import {
    customType,
    index,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    primaryKey,
    real,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";

/**
 * Custom Drizzle column type for PostgreSQL `tsvector`.
 * Ensures `drizzle-kit push` sees the real column type instead of `text`,
 * preventing it from silently downgrading the column.
 */
const tsvector = customType<{ data: string }>({
    dataType() {
        return "tsvector";
    },
});

export const entityTypeEnum = pgEnum("entity_type", [
    "person",
    "org",
    "domain",
    "email",
    "handle",
    "ip",
    "phone",
]);

export const edgeTypeEnum = pgEnum("edge_type", [
    "owns",
    "works_at",
    "associated_with",
    "alias_of",
]);

export const crawlStatusEnum = pgEnum("crawl_status", [
    "pending",
    "running",
    "completed",
    "failed",
]);

export const entities = pgTable(
    "entities",
    {
        id: uuid().defaultRandom().primaryKey(),
        type: entityTypeEnum().notNull(),
        name: text().notNull(),
        metadata: jsonb().$type<Record<string, unknown>>().default({}),
        searchVector: tsvector("search_vector"),
        deletedAt: timestamp("deleted_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull()
            .$onUpdate(() => new Date()),
    },
    (table) => [
        index("entities_type_idx").on(table.type),
        index("entities_deleted_at_idx")
            .on(table.deletedAt)
            .where(sql`deleted_at IS NULL`),
        uniqueIndex("entities_type_name_active_idx")
            .on(table.type, table.name)
            .where(sql`deleted_at IS NULL`),
        index("entities_search_vector_idx").using("gin", table.searchVector),
    ],
);

export const entityEdges = pgTable(
    "entity_edges",
    {
        id: uuid().defaultRandom().primaryKey(),
        sourceId: uuid("source_id")
            .references(() => entities.id)
            .notNull(),
        targetId: uuid("target_id")
            .references(() => entities.id)
            .notNull(),
        edgeType: edgeTypeEnum("edge_type").notNull(),
        confidence: real().notNull().default(1.0),
        sourceProvider: text("source_provider"),
        metadata: jsonb().$type<Record<string, unknown>>().default({}),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("edges_source_id_idx").on(table.sourceId),
        index("edges_target_id_idx").on(table.targetId),
        index("edges_source_type_idx").on(table.sourceId, table.edgeType),
        index("edges_target_type_idx").on(table.targetId, table.edgeType),
        uniqueIndex("edges_unique_active_idx")
            .on(table.sourceId, table.targetId, table.edgeType)
            .where(sql`true`),
    ],
);

export const dataPoints = pgTable(
    "data_points",
    {
        id: uuid().defaultRandom().primaryKey(),
        entityId: uuid("entity_id")
            .references(() => entities.id)
            .notNull(),
        sourceProvider: text("source_provider").notNull(),
        sourceUrl: text("source_url").notNull(),
        rawData: jsonb("raw_data").$type<Record<string, unknown>>().notNull(),
        fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [index("data_points_entity_id_idx").on(table.entityId)],
);

export const investigations = pgTable("investigations", {
    id: uuid().defaultRandom().primaryKey(),
    name: text().notNull(),
    description: text(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
});

export const investigationEntities = pgTable(
    "investigation_entities",
    {
        investigationId: uuid("investigation_id")
            .references(() => investigations.id, { onDelete: "cascade" })
            .notNull(),
        entityId: uuid("entity_id")
            .references(() => entities.id)
            .notNull(),
        addedAt: timestamp("added_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        notes: text(),
    },
    (table) => [
        primaryKey({
            columns: [table.investigationId, table.entityId],
        }),
    ],
);

export const crawlJobs = pgTable("crawl_jobs", {
    id: uuid().defaultRandom().primaryKey(),
    seedQuery: text("seed_query").notNull(),
    seedType: entityTypeEnum("seed_type").notNull(),
    maxDepth: integer("max_depth").notNull(),
    currentDepth: integer("current_depth").notNull().default(0),
    status: crawlStatusEnum().notNull().default("pending"),
    totalEntities: integer("total_entities").notNull().default(0),
    totalEdges: integer("total_edges").notNull().default(0),
    error: text(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
    completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const crawlJobEntities = pgTable(
    "crawl_job_entities",
    {
        crawlJobId: uuid("crawl_job_id")
            .references(() => crawlJobs.id, { onDelete: "cascade" })
            .notNull(),
        entityId: uuid("entity_id")
            .references(() => entities.id)
            .notNull(),
        depth: integer().notNull(),
        scraperUsed: text("scraper_used"),
        addedAt: timestamp("added_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        primaryKey({
            columns: [table.crawlJobId, table.entityId],
        }),
    ],
);
