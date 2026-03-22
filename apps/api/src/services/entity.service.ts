import { type Database, dataPoints, entities, entityEdges } from "@argus/db";
import { aliasedTable, and, eq, isNull, or, sql } from "drizzle-orm";

export function createEntityService(db: Database) {
    return {
        async list(type?: string) {
            const conditions = [isNull(entities.deletedAt)];
            if (type) {
                conditions.push(
                    eq(
                        entities.type,
                        type as (typeof entities.type.enumValues)[number],
                    ),
                );
            }
            return db
                .select()
                .from(entities)
                .where(and(...conditions));
        },

        async getById(id: string) {
            const [entity] = await db
                .select()
                .from(entities)
                .where(and(eq(entities.id, id), isNull(entities.deletedAt)));
            return entity;
        },

        async create(data: {
            type: (typeof entities.type.enumValues)[number];
            name: string;
            metadata?: Record<string, unknown>;
        }) {
            const [entity] = await db.insert(entities).values(data).returning();
            return entity;
        },

        async update(
            id: string,
            data: {
                name?: string;
                metadata?: Record<string, unknown>;
            },
        ) {
            const [entity] = await db
                .update(entities)
                .set(data)
                .where(and(eq(entities.id, id), isNull(entities.deletedAt)))
                .returning();
            return entity;
        },

        async softDelete(id: string) {
            const [entity] = await db
                .update(entities)
                .set({ deletedAt: new Date() })
                .where(and(eq(entities.id, id), isNull(entities.deletedAt)))
                .returning();
            return entity;
        },

        async getEdges(id: string) {
            const sourceEntity = aliasedTable(entities, "source_entity");
            const targetEntity = aliasedTable(entities, "target_entity");
            return db
                .select({
                    id: entityEdges.id,
                    sourceId: entityEdges.sourceId,
                    sourceName: sourceEntity.name,
                    sourceType: sourceEntity.type,
                    targetId: entityEdges.targetId,
                    targetName: targetEntity.name,
                    targetType: targetEntity.type,
                    edgeType: entityEdges.edgeType,
                    confidence: entityEdges.confidence,
                    sourceProvider: entityEdges.sourceProvider,
                    createdAt: entityEdges.createdAt,
                })
                .from(entityEdges)
                .innerJoin(
                    sourceEntity,
                    eq(entityEdges.sourceId, sourceEntity.id),
                )
                .innerJoin(
                    targetEntity,
                    eq(entityEdges.targetId, targetEntity.id),
                )
                .where(
                    or(
                        eq(entityEdges.sourceId, id),
                        eq(entityEdges.targetId, id),
                    ),
                );
        },

        async getDataPoints(id: string) {
            return db
                .select()
                .from(dataPoints)
                .where(eq(dataPoints.entityId, id));
        },

        async search({
            query,
            type,
            limit,
            offset,
        }: {
            query: string;
            type?: string;
            limit: number;
            offset: number;
        }) {
            const tsquery = sql`plainto_tsquery('english', ${query})`;
            const conditions = [
                sql`search_vector @@ ${tsquery}`,
                isNull(entities.deletedAt),
            ];
            if (type) {
                conditions.push(
                    eq(
                        entities.type,
                        type as (typeof entities.type.enumValues)[number],
                    ),
                );
            }

            const rows = await db
                .select({
                    id: entities.id,
                    type: entities.type,
                    name: entities.name,
                    metadata: entities.metadata,
                    deletedAt: entities.deletedAt,
                    createdAt: entities.createdAt,
                    updatedAt: entities.updatedAt,
                    rank: sql<number>`ts_rank_cd(search_vector, ${tsquery})`.as(
                        "rank",
                    ),
                    total: sql<number>`count(*) OVER()`
                        .mapWith(Number)
                        .as("total"),
                })
                .from(entities)
                .where(and(...conditions))
                .orderBy(sql`rank DESC`)
                .limit(limit)
                .offset(offset);

            const total = rows.length > 0 ? (rows[0]?.total ?? 0) : 0;
            const results = rows.map(({ rank, total, ...entity }) => entity);

            return { results, total };
        },
    };
}
