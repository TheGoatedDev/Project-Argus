import { sql } from "drizzle-orm";
import {
    index,
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

export const entities = pgTable(
    "entities",
    {
        id: uuid().defaultRandom().primaryKey(),
        type: entityTypeEnum().notNull(),
        name: text().notNull(),
        metadata: jsonb().$type<Record<string, unknown>>().default({}),
        searchVector: text("search_vector").generatedAlwaysAs(
            sql`setweight(to_tsvector('english', coalesce(name, '')), 'A') || setweight(to_tsvector('english', coalesce(metadata::text, '')), 'B')`,
        ),
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
